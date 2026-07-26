import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth-session";
import { getSupabaseAdmin } from "@/lib/supabase";

const ADMIN_EMAIL = "admin@jukwaakenya.co.ke";
const OUTREACH_PREFIX = "[JUKWAA_OUTREACH]";

const statusValues = ["New", "Contacted", "Follow-up", "Demo booked", "Demo done", "Converted", "Not interested"] as const;

const leadSchema = z.object({
  name: z.string().trim().min(2, "Name is required."),
  seat: z.string().trim().min(2, "Seat is required."),
  contact: z.string().trim().optional().nullable(),
  phoneNumber: z.string().trim().optional().nullable(),
  status: z.enum(statusValues).default("New"),
  demoDate: z.string().trim().optional().nullable(),
  outcome: z.string().trim().optional().nullable(),
  nextFollowUp: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

const patchSchema = leadSchema.partial().extend({
  id: z.string().uuid(),
});

type OutreachLead = {
  id: string;
  name: string;
  seat: string;
  contact: string | null;
  phoneNumber: string | null;
  status: (typeof statusValues)[number];
  demoDate: string | null;
  outcome: string | null;
  nextFollowUp: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  storage: "platform_client_outreach" | "support_tickets";
};

type OutreachDbRow = {
  id: string;
  name: string;
  seat: string;
  contact: string | null;
  phone_number: string | null;
  status: (typeof statusValues)[number];
  demo_date: string | null;
  outcome: string | null;
  next_follow_up: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type TicketRow = {
  id: string;
  title: string;
  description: string | null;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  priority: string;
  created_at: string;
  updated_at: string;
};

function adminOnly(responseSession: { email?: string | null } | null) {
  return String(responseSession?.email ?? "").toLowerCase() === ADMIN_EMAIL;
}

function cleanDate(value?: string | null) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function rowFromPayload(payload: z.infer<typeof leadSchema>, userId?: string | null) {
  return {
    name: payload.name,
    seat: payload.seat,
    contact: payload.contact || null,
    phone_number: payload.phoneNumber || null,
    status: payload.status,
    demo_date: cleanDate(payload.demoDate),
    outcome: payload.outcome || null,
    next_follow_up: cleanDate(payload.nextFollowUp),
    notes: payload.notes || null,
    owner_email: ADMIN_EMAIL,
    created_by: userId || null,
  };
}

function serialize(row: OutreachDbRow): OutreachLead {
  return {
    id: row.id,
    name: row.name,
    seat: row.seat,
    contact: row.contact,
    phoneNumber: row.phone_number,
    status: row.status,
    demoDate: row.demo_date,
    outcome: row.outcome,
    nextFollowUp: row.next_follow_up,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    storage: "platform_client_outreach",
  };
}

function ticketStatus(status: string) {
  if (status === "Converted" || status === "Demo done") return "Resolved";
  if (status === "Not interested") return "Closed";
  if (status === "Contacted" || status === "Follow-up" || status === "Demo booked") return "In Progress";
  return "Open";
}

function statusFromTicket(status: string, fallback?: string) {
  if (status === "Resolved") return fallback === "Converted" ? "Converted" : "Demo done";
  if (status === "Closed") return "Not interested";
  if (status === "In Progress") return fallback && fallback !== "New" ? fallback : "Contacted";
  return "New";
}

function ticketTitle(name: string, seat: string) {
  return `${OUTREACH_PREFIX} ${name} - ${seat}`;
}

function ticketDescription(payload: z.infer<typeof leadSchema>) {
  return JSON.stringify({
    contact: payload.contact || null,
    phoneNumber: payload.phoneNumber || null,
    status: payload.status,
    demoDate: cleanDate(payload.demoDate),
    outcome: payload.outcome || null,
    nextFollowUp: cleanDate(payload.nextFollowUp),
    notes: payload.notes || null,
  });
}

function serializeTicket(row: TicketRow): OutreachLead {
  const title = row.title.replace(OUTREACH_PREFIX, "").trim();
  const [namePart, ...seatParts] = title.split(" - ");
  let details: Partial<OutreachLead> = {};
  try {
    details = JSON.parse(row.description || "{}") as Partial<OutreachLead>;
  } catch {
    details = {};
  }
  const savedStatus = String(details.status ?? "");
  return {
    id: row.id,
    name: namePart || "Candidate",
    seat: seatParts.join(" - ") || "Seat not set",
    contact: details.contact ?? null,
    phoneNumber: details.phoneNumber ?? null,
    status: statusFromTicket(row.status, savedStatus) as OutreachLead["status"],
    demoDate: details.demoDate ?? null,
    outcome: details.outcome ?? null,
    nextFollowUp: details.nextFollowUp ?? null,
    notes: details.notes ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    storage: "support_tickets",
  };
}

function summary(leads: OutreachLead[]) {
  const dueToday = new Date().toISOString().slice(0, 10);
  return {
    total: leads.length,
    contacted: leads.filter((lead) => lead.status !== "New").length,
    demosBooked: leads.filter((lead) => lead.status === "Demo booked").length,
    converted: leads.filter((lead) => lead.status === "Converted").length,
    followUpsDue: leads.filter((lead) => lead.nextFollowUp && lead.nextFollowUp <= dueToday && !["Converted", "Not interested"].includes(lead.status)).length,
  };
}

function tableMissing(error: { code?: string; message?: string } | null) {
  return Boolean(error && (error.code === "42P01" || /platform_client_outreach|relation .* does not exist/i.test(error.message ?? "")));
}

async function loadLeads(): Promise<{ leads: OutreachLead[]; storage: "platform_client_outreach" | "support_tickets" }> {
  const admin = getSupabaseAdmin();
  const outreachTable = admin.from("platform_client_outreach" as never) as any;
  const supportTable = admin.from("support_tickets" as never) as any;
  const { data, error } = await outreachTable
    .select("id, name, seat, contact, phone_number, status, demo_date, outcome, next_follow_up, notes, created_at, updated_at")
    .eq("owner_email", ADMIN_EMAIL)
    .order("updated_at", { ascending: false });

  if (!error) {
    const leads: OutreachLead[] = (Array.isArray(data) ? data : []).map((item: unknown) => serialize(item as OutreachDbRow));
    return { leads, storage: "platform_client_outreach" as const };
  }

  if (!tableMissing(error)) throw error;

  const tickets = await supportTable
    .select("id, title, description, status, priority, created_at, updated_at")
    .is("tenant_id", null)
    .like("title", `${OUTREACH_PREFIX}%`)
    .order("updated_at", { ascending: false });
  if (tickets.error) throw tickets.error;
  const leads: OutreachLead[] = (Array.isArray(tickets.data) ? tickets.data : []).map((item: unknown) => serializeTicket(item as TicketRow));
  return { leads, storage: "support_tickets" as const };
}

async function getStorage() {
  const loaded = await loadLeads();
  return loaded.storage;
}

export async function GET(request: Request) {
  const auth = await requireSession(request, { platformAdmin: true });
  if (auth.response) return auth.response;
  if (!adminOnly(auth.session)) return NextResponse.json({ error: "Only admin@jukwaakenya.co.ke can manage client outreach." }, { status: 403 });

  const { leads, storage } = await loadLeads();
  const url = new URL(request.url);
  if (url.searchParams.get("format") === "csv") {
    const header = ["Name", "Seat", "Contact", "Phone", "Status", "Demo Date", "Outcome", "Next Follow-up", "Notes", "Updated"];
    const lines = leads.map((lead: OutreachLead) => [lead.name, lead.seat, lead.contact, lead.phoneNumber, lead.status, lead.demoDate, lead.outcome, lead.nextFollowUp, lead.notes, lead.updatedAt]
      .map((value: string | null) => `"${String(value ?? "").replace(/"/g, '""')}"`)
      .join(","));
    return new Response([header.join(","), ...lines].join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="jukwaa-client-outreach-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ leads, summary: summary(leads), storage });
}

export async function POST(request: Request) {
  const auth = await requireSession(request, { platformAdmin: true });
  if (auth.response) return auth.response;
  if (!adminOnly(auth.session)) return NextResponse.json({ error: "Only admin@jukwaakenya.co.ke can manage client outreach." }, { status: 403 });

  const parsed = leadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Client outreach details are invalid." }, { status: 400 });

  const admin = getSupabaseAdmin();
  const storage = await getStorage();
  if (storage === "platform_client_outreach") {
    const outreachTable = admin.from("platform_client_outreach" as never) as any;
    const { error } = await outreachTable.insert(rowFromPayload(parsed.data, auth.session?.userId));
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else {
    const supportTable = admin.from("support_tickets" as never) as any;
    const { error } = await supportTable.insert({
      tenant_id: null,
      candidate_id: null,
      title: ticketTitle(parsed.data.name, parsed.data.seat),
      description: ticketDescription(parsed.data),
      status: ticketStatus(parsed.data.status),
      priority: "Medium",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { leads } = await loadLeads();
  return NextResponse.json({ status: "Saved", leads, summary: summary(leads) });
}

export async function PATCH(request: Request) {
  const auth = await requireSession(request, { platformAdmin: true });
  if (auth.response) return auth.response;
  if (!adminOnly(auth.session)) return NextResponse.json({ error: "Only admin@jukwaakenya.co.ke can manage client outreach." }, { status: 403 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Client outreach update is invalid." }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { id, ...payload } = parsed.data;
  const storage = await getStorage();
  if (storage === "platform_client_outreach") {
    const outreachTable = admin.from("platform_client_outreach" as never) as any;
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (payload.name !== undefined) update.name = payload.name;
    if (payload.seat !== undefined) update.seat = payload.seat;
    if (payload.contact !== undefined) update.contact = payload.contact || null;
    if (payload.phoneNumber !== undefined) update.phone_number = payload.phoneNumber || null;
    if (payload.status !== undefined) update.status = payload.status;
    if (payload.demoDate !== undefined) update.demo_date = cleanDate(payload.demoDate);
    if (payload.outcome !== undefined) update.outcome = payload.outcome || null;
    if (payload.nextFollowUp !== undefined) update.next_follow_up = cleanDate(payload.nextFollowUp);
    if (payload.notes !== undefined) update.notes = payload.notes || null;
    const { error } = await outreachTable.update(update).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else {
    const supportTable = admin.from("support_tickets" as never) as any;
    const current = await supportTable.select("id, title, description, status, priority, created_at, updated_at").eq("id", id).maybeSingle();
    if (current.error || !current.data) return NextResponse.json({ error: current.error?.message ?? "Outreach record was not found." }, { status: 404 });
    const existing = serializeTicket(current.data as TicketRow);
    const merged = {
      name: payload.name ?? existing.name,
      seat: payload.seat ?? existing.seat,
      contact: payload.contact ?? existing.contact,
      phoneNumber: payload.phoneNumber ?? existing.phoneNumber,
      status: payload.status ?? existing.status,
      demoDate: payload.demoDate ?? existing.demoDate,
      outcome: payload.outcome ?? existing.outcome,
      nextFollowUp: payload.nextFollowUp ?? existing.nextFollowUp,
      notes: payload.notes ?? existing.notes,
    };
    const { error } = await supportTable.update({
      title: ticketTitle(merged.name, merged.seat),
      description: ticketDescription(merged),
      status: ticketStatus(merged.status),
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { leads } = await loadLeads();
  return NextResponse.json({ status: "Updated", leads, summary: summary(leads) });
}

export async function DELETE(request: Request) {
  const auth = await requireSession(request, { platformAdmin: true });
  if (auth.response) return auth.response;
  if (!adminOnly(auth.session)) return NextResponse.json({ error: "Only admin@jukwaakenya.co.ke can manage client outreach." }, { status: 403 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "A valid outreach ID is required." }, { status: 400 });

  const admin = getSupabaseAdmin();
  const storage = await getStorage();
  const table = storage === "platform_client_outreach"
    ? (admin.from("platform_client_outreach" as never) as any)
    : (admin.from("support_tickets" as never) as any);
  const { error } = await table.delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { leads } = await loadLeads();
  return NextResponse.json({ status: "Deleted", leads, summary: summary(leads) });
}
