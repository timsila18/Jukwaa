import { existsSync, readFileSync } from "fs";
import path from "path";
import { NextRequest } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { requireSession, requireWorkspaceAccess } from "@/lib/auth-session";
import { getLiveWorkspaceSnapshot, reportRowsFromSnapshot, type LiveSnapshot } from "@/lib/live-dashboard";

type ReportRow = Record<string, unknown>;

const brand = {
  navy: "061426",
  blue: "0077B6",
  gold: "D6A633",
  green: "0E9F6E",
  red: "DC2626",
  ink: "16243A",
  muted: "64748B",
  paleBlue: "EEF8FF",
  paleGold: "FFF8E6",
};

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function formatDateTime(date = new Date()) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  }).format(date);
}

function titleCase(value: string) {
  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function candidateName(snapshot: LiveSnapshot) {
  return text(snapshot.campaign?.candidate_name, text(snapshot.workspace.fullName, "JUKWAA Candidate"));
}

function campaignName(snapshot: LiveSnapshot) {
  return text(snapshot.campaign?.campaign_name, `${candidateName(snapshot)} Campaign`);
}

function electiveScope(snapshot: LiveSnapshot) {
  const position = text(snapshot.campaign?.position_targeted, text(snapshot.campaign?.position_contesting, "Candidate"));
  const county = text(snapshot.campaign?.county);
  const constituency = text(snapshot.campaign?.constituency);
  const ward = text(snapshot.campaign?.ward);
  const lower = position.toLowerCase();
  if (lower.includes("president")) return `${position} - Kenya`;
  if (["governor", "senator", "woman", "women"].some((term) => lower.includes(term))) return `${position}${county ? ` - ${county} County` : ""}`;
  if (lower.includes("mca")) return `${position}${ward ? ` - ${ward} Ward` : constituency ? ` - ${constituency} Constituency` : ""}`;
  return `${position}${constituency ? ` - ${constituency} Constituency` : county ? ` - ${county} County` : ""}`;
}

function generatedBy(snapshot: LiveSnapshot) {
  return text(snapshot.workspace.fullName, text(snapshot.workspace.email, "JUKWAA user"));
}

function supporterDetailRows(snapshot: LiveSnapshot) {
  return snapshot.supporters.map((supporter, index) => ({
    No: index + 1,
    "Full Name": text(supporter.full_name, "Not recorded"),
    "Phone Number": text(supporter.phone_number, "Not recorded"),
    County: text(supporter.county_name, "Not assigned"),
    Constituency: text(supporter.constituency_name, "Not assigned"),
    Ward: text(supporter.ward_name, "Not assigned"),
    "Village / Estate": text(supporter.village_name, "Not assigned"),
    "Polling Station": text(supporter.polling_station_name, "Not assigned"),
    "Registered Voters": supporter.registered_voters ?? "",
    "Support Level": text(supporter.support_level, "Unknown"),
    "Key Issue": text(supporter.key_issue, "Not recorded"),
    "Volunteer Interest": supporter.volunteer_interest ? "Yes" : "No",
    "Consent to Contact": supporter.consent_to_contact ? "Yes" : "No",
    Notes: text(supporter.notes, ""),
    "Date Added": text(supporter.created_at, ""),
  }));
}

function groupSummary(rows: ReportRow[], field: string, label: string) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = text(row[field], "Not assigned");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, total]) => ({ [label]: name, "Total Supporters": total }))
    .sort((a, b) => Number(b["Total Supporters"]) - Number(a["Total Supporters"]) || String(a[label]).localeCompare(String(b[label])));
}

function buildReport(snapshot: LiveSnapshot, report: string) {
  const isSupporterReport = report.startsWith("supporters");
  const rows = isSupporterReport ? supporterDetailRows(snapshot) : reportRowsFromSnapshot(snapshot, report);
  const summary = isSupporterReport
    ? [
        { title: "Summary by Ward", rows: groupSummary(rows, "Ward", "Ward") },
        { title: "Summary by Polling Station", rows: groupSummary(rows, "Polling Station", "Polling Station") },
        { title: "Summary by Support Level", rows: groupSummary(rows, "Support Level", "Support Level") },
      ]
    : [{ title: "Report Summary", rows: reportRowsFromSnapshot(snapshot, report) }];
  return {
    title: isSupporterReport ? "Supporter Register Report" : `${titleCase(report)} Report`,
    rows,
    summary,
  };
}

function csvForReport(mainRows: ReportRow[], summaryTables: Array<{ title: string; rows: ReportRow[] }>) {
  const sections: string[] = [];
  const addTable = (title: string, rows: ReportRow[]) => {
    sections.push(title);
    const headers = Object.keys(rows[0] ?? {});
    sections.push(headers.map(csvEscape).join(","));
    sections.push(...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")));
  };
  addTable("DETAILS", mainRows);
  for (const summary of summaryTables) {
    sections.push("");
    addTable(summary.title.toUpperCase(), summary.rows);
  }
  return sections.join("\n");
}

function logoDataUrl(fileName: string) {
  const file = path.join(process.cwd(), "public", fileName);
  if (!existsSync(file)) return "";
  return `data:image/png;base64,${readFileSync(file).toString("base64")}`;
}

function addPdfHeader(document: jsPDF, snapshot: LiveSnapshot, title: string, generatedAt: string, logo: string, watermark: string) {
  const width = document.internal.pageSize.getWidth();
  document.setFillColor(`#${brand.navy}`);
  document.rect(0, 0, width, 34, "F");
  if (logo) document.addImage(logo, "PNG", 12, 7, 48, 18);
  document.setTextColor("#FFFFFF");
  document.setFontSize(15);
  document.setFont("helvetica", "bold");
  document.text(title, 68, 14);
  document.setFontSize(9);
  document.setFont("helvetica", "normal");
  document.text(`${candidateName(snapshot)} | ${electiveScope(snapshot)}`, 68, 21);
  document.text(`Generated by ${generatedBy(snapshot)} on ${generatedAt}`, 68, 27);

  if (watermark) {
    const pdfWithGState = document as jsPDF & { GState?: new (options: { opacity: number }) => unknown; setGState?: (state: unknown) => void };
    if (pdfWithGState.GState && pdfWithGState.setGState) pdfWithGState.setGState(new pdfWithGState.GState({ opacity: 0.06 }));
    document.addImage(watermark, "PNG", width / 2 - 38, 86, 76, 76);
    if (pdfWithGState.GState && pdfWithGState.setGState) pdfWithGState.setGState(new pdfWithGState.GState({ opacity: 1 }));
  }
}

function addPdfFooter(document: jsPDF) {
  const pages = document.getNumberOfPages();
  const width = document.internal.pageSize.getWidth();
  const height = document.internal.pageSize.getHeight();
  for (let page = 1; page <= pages; page += 1) {
    document.setPage(page);
    document.setDrawColor(`#${brand.gold}`);
    document.line(12, height - 13, width - 12, height - 13);
    document.setTextColor(`#${brand.muted}`);
    document.setFontSize(8);
    document.text("JUKWAA Kenya - Where Leadership Meets the People", 12, height - 7);
    document.text(`Page ${page} of ${pages}`, width - 30, height - 7);
  }
}

function pdfTable(document: jsPDF, title: string, rows: ReportRow[], startY: number, snapshot: LiveSnapshot, reportTitle: string, generatedAt: string, logo: string, watermark: string) {
  const headers = Object.keys(rows[0] ?? {});
  document.setFontSize(12);
  document.setFont("helvetica", "bold");
  document.setTextColor(`#${brand.ink}`);
  document.text(title, 12, startY);
  autoTable(document, {
    startY: startY + 4,
    head: [headers],
    body: rows.map((row) => headers.map((header) => String(row[header] ?? ""))),
    styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak", textColor: `#${brand.ink}`, lineColor: "#DCE7F3", lineWidth: 0.1 },
    headStyles: { fillColor: `#${brand.navy}`, textColor: "#FFFFFF", fontStyle: "bold" },
    alternateRowStyles: { fillColor: `#${brand.paleBlue}` },
    margin: { left: 12, right: 12, top: 42, bottom: 18 },
    theme: "grid",
    didDrawPage: () => {
      addPdfHeader(document, snapshot, reportTitle, generatedAt, logo, watermark);
    },
  });
  return (document as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY + 20;
}

function buildPdf(snapshot: LiveSnapshot, title: string, rows: ReportRow[], summaryTables: Array<{ title: string; rows: ReportRow[] }>, generatedAt: string) {
  const document = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const logo = logoDataUrl("jukwaa-logo-sidebar.png") || logoDataUrl("jukwaa-logo.png");
  const watermark = logoDataUrl("app-icon.png") || logoDataUrl("icons/icon-512.png");
  addPdfHeader(document, snapshot, title, generatedAt, logo, watermark);

  document.setTextColor(`#${brand.ink}`);
  document.setFontSize(10);
  document.text(`Campaign: ${campaignName(snapshot)}`, 12, 44);
  document.text(`Scope: ${electiveScope(snapshot)}`, 12, 50);
  document.text(`Total records: ${rows.length.toLocaleString("en-KE")}`, 12, 56);

  let y = pdfTable(document, "Report Details", rows, 66, snapshot, title, generatedAt, logo, watermark);
  for (const summary of summaryTables) {
    if (y > 160) {
      document.addPage();
      addPdfHeader(document, snapshot, title, generatedAt, logo, watermark);
      y = 44;
    } else {
      y += 10;
    }
      y = pdfTable(document, summary.title, summary.rows, y, snapshot, title, generatedAt, logo, watermark);
  }
  addPdfFooter(document);
  return Buffer.from(document.output("arraybuffer"));
}

function buildWorkbook(snapshot: LiveSnapshot, title: string, rows: ReportRow[], summaryTables: Array<{ title: string; rows: ReportRow[] }>, generatedAt: string) {
  const workbook = XLSX.utils.book_new();
  workbook.Props = {
    Title: title,
    Subject: `${campaignName(snapshot)} - ${electiveScope(snapshot)}`,
    Author: "JUKWAA Kenya",
    Company: "JUKWAA Kenya",
    CreatedDate: new Date(),
  };
  const metadata = [
    ["JUKWAA Kenya"],
    [title],
    ["Candidate", candidateName(snapshot)],
    ["Campaign", campaignName(snapshot)],
    ["Scope", electiveScope(snapshot)],
    ["Generated By", generatedBy(snapshot)],
    ["Generated At", generatedAt],
  ];
  const details = XLSX.utils.aoa_to_sheet([...metadata, [], Object.keys(rows[0] ?? {}), ...rows.map((row) => Object.keys(rows[0] ?? {}).map((header) => row[header] ?? ""))]);
  details["!cols"] = Object.keys(rows[0] ?? {}).map((header) => ({ wch: Math.max(14, Math.min(36, header.length + 8)) }));
  details["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }];
  XLSX.utils.book_append_sheet(workbook, details, "Details");

  for (const summary of summaryTables) {
    const sheetName = summary.title.replace(/[^A-Za-z0-9 ]/g, "").slice(0, 31) || "Summary";
    const sheet = XLSX.utils.json_to_sheet(summary.rows);
    sheet["!cols"] = Object.keys(summary.rows[0] ?? {}).map((header) => ({ wch: Math.max(16, header.length + 6) }));
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  }
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx", cellStyles: true }) as Buffer;
}

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;
  const access = await requireWorkspaceAccess(auth.session);
  if (access.response) return access.response;

  const searchParams = request.nextUrl.searchParams;
  const format = (searchParams.get("format") ?? "csv").toLowerCase();
  const report = searchParams.get("report") ?? "supporters-by-area";
  const snapshot = await getLiveWorkspaceSnapshot(auth.session, access.access);
  const { title, rows, summary } = buildReport(snapshot, report);
  const generatedAt = formatDateTime();
  const filename = `jukwaa-${report}-${new Date().toISOString().slice(0, 10)}`;

  if (format === "xlsx") {
    const buffer = buildWorkbook(snapshot, title, rows, summary, generatedAt);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  }

  if (format === "pdf") {
    const buffer = buildPdf(snapshot, title, rows, summary, generatedAt);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${filename}.pdf"`,
      },
    });
  }

  const csv = csvForReport(rows, summary);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}
