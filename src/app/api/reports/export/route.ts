import { NextRequest } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { reportRows } from "@/lib/demo-data";

function csvEscape(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format") ?? "csv";
  const report = searchParams.get("report") ?? "supporters-by-ward";
  const rows = reportRows(report);
  const headers = Object.keys(rows[0] ?? { name: "", value: 0 });
  const filename = `jukwaa-${report}`;

  if (format === "xlsx") {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  }

  if (format === "pdf") {
    const document = new jsPDF();
    document.setFontSize(16);
    document.text("JUKWAA Campaign Report", 14, 18);
    document.setFontSize(10);
    document.text(report.replaceAll("-", " "), 14, 26);
    autoTable(document, {
      startY: 34,
      head: [headers],
      body: rows.map((row) => headers.map((header) => String(row[header] ?? ""))),
    });
    const buffer = Buffer.from(document.output("arraybuffer"));

    return new Response(new Uint8Array(buffer), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${filename}.pdf"`,
      },
    });
  }

  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header] ?? "")).join(","))].join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}
