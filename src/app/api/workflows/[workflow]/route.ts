import { NextResponse } from "next/server";
import { z } from "zod";
import { getLooseSupabaseAdmin } from "@/lib/supabase";
import { shortCode, writeAudit } from "@/lib/server-workflows";
import { enforceRateLimit, requestKey } from "@/lib/rate-limit";
import { requireSession } from "@/lib/auth-session";

const workflowSchemas = {
  supporter: z.object({
    fullName: z.string().trim().min(2),
    phoneNumber: z.string().trim().min(7),
    supportLevel: z.enum(["Strong Supporter", "Leaning Supporter", "Undecided", "Opponent", "Unknown"]).default("Unknown"),
    keyIssue: z.string().trim().optional().or(z.literal("")),
    consentToContact: z.boolean().default(true),
    notes: z.string().trim().optional().or(z.literal("")),
  }),
  volunteer: z.object({
    fullName: z.string().trim().min(2),
    phoneNumber: z.string().trim().min(7),
    email: z.string().trim().email().optional().or(z.literal("")),
    notes: z.string().trim().optional().or(z.literal("")),
  }),
  task: z.object({
    title: z.string().trim().min(2),
    description: z.string().trim().optional().or(z.literal("")),
    dueDate: z.string().trim().min(8),
  }),
  issue: z.object({
    title: z.string().trim().min(2),
    category: z.enum(["Roads", "Water", "Education", "Healthcare", "Agriculture", "Youth Employment", "Security", "Electricity", "Business", "Environment", "Other"]).default("Other"),
    description: z.string().trim().optional().or(z.literal("")),
    priority: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
  }),
  event: z.object({
    title: z.string().trim().min(2),
    type: z.enum(["Rally", "Town Hall", "Community Meeting", "Fundraiser", "Press Conference", "Volunteer Training"]).default("Community Meeting"),
    venue: z.string().trim().min(2),
    eventDate: z.string().trim().min(8),
    startTime: z.string().trim().default("09:00"),
    expectedAttendance: z.coerce.number().int().min(0).default(0),
  }),
  fieldVisit: z.object({
    visitPurpose: z.string().trim().min(2),
    supportersEngaged: z.coerce.number().int().min(0).default(0),
    notes: z.string().trim().optional().or(z.literal("")),
  }),
  result: z.object({
    pollingStationName: z.string().trim().optional().or(z.literal("")),
    candidateName: z.string().trim().min(2),
    votes: z.coerce.number().int().min(0),
    totalVotes: z.coerce.number().int().min(0),
    rejectedVotes: z.coerce.number().int().min(0).default(0),
  }),
  payment: z.object({
    reference: z.string().trim().min(4),
    amountKes: z.coerce.number().positive(),
    status: z.enum(["Pending", "Confirmed", "Failed"]).default("Pending"),
  }),
  userStatus: z.object({
    invitationId: z.string().trim().optional(),
    status: z.enum(["Accepted", "Revoked", "Expired", "Pending"]),
  }),
  supportTicket: z.object({
    title: z.string().trim().min(2),
    description: z.string().trim().optional().or(z.literal("")),
    priority: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
  }),
  aiContent: z.object({
    title: z.string().trim().min(2),
    assetType: z.string().trim().default("Campaign Message"),
    audience: z.string().trim().optional().or(z.literal("")),
  }),
} as const;

type WorkflowName = keyof typeof workflowSchemas;

const workflowRoles: Record<WorkflowName, string[]> = {
  supporter: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Village Coordinator", "Volunteer", "Data Clerk", "Admin"],
  volunteer: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Admin"],
  task: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Admin"],
  issue: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Village Coordinator", "Volunteer", "Polling Agent", "Admin"],
  event: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Admin"],
  fieldVisit: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Village Coordinator", "Volunteer", "Admin"],
  result: ["Candidate", "Campaign Manager", "Polling Agent", "Data Clerk", "Admin"],
  payment: ["Candidate", "Campaign Manager", "Admin"],
  userStatus: ["Candidate", "Campaign Manager", "Admin"],
  supportTicket: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Village Coordinator", "Volunteer", "Polling Agent", "Media Team", "Data Clerk", "Admin"],
  aiContent: ["Candidate", "Campaign Manager", "Media Team", "Admin"],
};

async function firstId(table: string, tenantId: string, column = "id") {
  const { data } = await getLooseSupabaseAdmin().from(table).select(column).eq("tenant_id", tenantId).limit(1).maybeSingle();
  return data?.[column] as string | undefined;
}

export async function POST(request: Request, context: { params: Promise<{ workflow: string }> }) {
  const limited = await enforceRateLimit(requestKey(request, "workflow"), 60, 60_000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many workflow submissions. Try again shortly." }, { status: 429 });
  }

  const { workflow } = await context.params;
  if (!(workflow in workflowSchemas)) {
    return NextResponse.json({ error: "Unsupported workflow." }, { status: 404 });
  }

  const name = workflow as WorkflowName;
  const parsed = workflowSchemas[name].safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Workflow payload is invalid." }, { status: 400 });
  }

  const auth = await requireSession(request);
  if (auth.response) return auth.response;
  if (!workflowRoles[name].includes(auth.session.role) && !auth.session.isPlatformAdmin) {
    return NextResponse.json({ error: "You do not have permission for this workflow." }, { status: 403 });
  }
  const workspace = { tenantId: auth.session.tenantId, candidateId: auth.session.candidateId };
  const supabase = getLooseSupabaseAdmin();
  let table = "";
  let payload: Record<string, unknown> = {};

  if (name === "supporter") {
    const data = parsed.data as z.infer<typeof workflowSchemas.supporter>;
    table = "supporters";
    payload = {
      tenant_id: workspace.tenantId,
      candidate_id: workspace.candidateId,
      full_name: data.fullName,
      phone_number: data.phoneNumber,
      support_level: data.supportLevel,
      key_issue: data.keyIssue || null,
      consent_to_contact: data.consentToContact,
      notes: data.notes || null,
    };
  }

  if (name === "volunteer") {
    const data = parsed.data as z.infer<typeof workflowSchemas.volunteer>;
    table = "volunteers";
    payload = {
      tenant_id: workspace.tenantId,
      candidate_id: workspace.candidateId,
      full_name: data.fullName,
      phone_number: data.phoneNumber,
      email: data.email || null,
      recruitment_source: "Dashboard",
      status: "Pending Approval",
      notes: data.notes || null,
    };
  }

  if (name === "task") {
    const data = parsed.data as z.infer<typeof workflowSchemas.task>;
    const volunteerId = await firstId("volunteers", workspace.tenantId);
    if (!volunteerId) return NextResponse.json({ error: "Create a volunteer before assigning a task." }, { status: 409 });
    table = "volunteer_tasks";
    payload = {
      tenant_id: workspace.tenantId,
      candidate_id: workspace.candidateId,
      task_type: "Door-to-door campaign",
      title: data.title,
      description: data.description || null,
      assigned_to: volunteerId,
      due_date: data.dueDate,
      status: "Pending",
    };
  }

  if (name === "issue") {
    const data = parsed.data as z.infer<typeof workflowSchemas.issue>;
    table = "community_issues";
    payload = {
      tenant_id: workspace.tenantId,
      candidate_id: workspace.candidateId,
      issue_title: data.title,
      category: data.category,
      description: data.description || null,
      priority_level: data.priority,
      status: "Open",
    };
  }

  if (name === "event") {
    const data = parsed.data as z.infer<typeof workflowSchemas.event>;
    table = "campaign_events";
    payload = {
      tenant_id: workspace.tenantId,
      candidate_id: workspace.candidateId,
      title: data.title,
      type: data.type,
      venue: data.venue,
      event_date: data.eventDate,
      start_time: data.startTime,
      expected_attendance: data.expectedAttendance,
    };
  }

  if (name === "fieldVisit") {
    const data = parsed.data as z.infer<typeof workflowSchemas.fieldVisit>;
    const volunteerId = await firstId("volunteers", workspace.tenantId);
    if (!volunteerId) return NextResponse.json({ error: "Create a volunteer before submitting a field visit." }, { status: 409 });
    table = "field_visits";
    payload = {
      tenant_id: workspace.tenantId,
      candidate_id: workspace.candidateId,
      volunteer_id: volunteerId,
      visit_date: new Date().toISOString().slice(0, 10),
      start_time: "09:00",
      visit_purpose: data.visitPurpose,
      supporters_engaged: data.supportersEngaged,
      notes: data.notes || null,
    };
  }

  if (name === "result") {
    const data = parsed.data as z.infer<typeof workflowSchemas.result>;
    const pollingStationId = await firstId("polling_stations", workspace.tenantId);
    if (!pollingStationId) return NextResponse.json({ error: "No polling station is configured." }, { status: 409 });
    table = "polling_results";
    payload = {
      tenant_id: workspace.tenantId,
      candidate_id: workspace.candidateId,
      polling_station_id: pollingStationId,
      candidate_name: data.candidateName,
      votes: data.votes,
      total_votes: data.totalVotes,
      rejected_votes: data.rejectedVotes,
      verification_status: "Pending",
    };
  }

  if (name === "payment") {
    const data = parsed.data as z.infer<typeof workflowSchemas.payment>;
    table = "payments";
    payload = {
      tenant_id: workspace.tenantId,
      candidate_id: workspace.candidateId,
      method: "Paybill",
      amount_kes: data.amountKes,
      status: data.status,
      reference: data.reference,
    };
  }

  if (name === "supportTicket") {
    const data = parsed.data as z.infer<typeof workflowSchemas.supportTicket>;
    table = "support_tickets";
    payload = {
      tenant_id: workspace.tenantId,
      candidate_id: workspace.candidateId,
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      status: "Open",
    };
  }

  if (name === "aiContent") {
    const data = parsed.data as z.infer<typeof workflowSchemas.aiContent>;
    table = "ai_content_assets";
    payload = {
      tenant_id: workspace.tenantId,
      candidate_id: workspace.candidateId,
      asset_type: data.assetType,
      title: data.title,
      audience: data.audience || null,
      status: "Draft",
    };
  }

  if (name === "userStatus") {
    const data = parsed.data as z.infer<typeof workflowSchemas.userStatus>;
    if (!data.invitationId || !z.string().uuid().safeParse(data.invitationId).success) {
      await writeAudit({ tenantId: workspace.tenantId, candidateId: workspace.candidateId, action: "Update", module: "User Approval", recordId: data.invitationId ?? "demo", newValue: data });
      return NextResponse.json({ id: data.invitationId ?? "demo", status: data.status, note: "Audit saved. Persisted invitation update requires a real invitation record." });
    }
    const { data: updated, error } = await supabase.from("invitations").update({ status: data.status }).eq("id", data.invitationId).select("id").single();
    if (error || !updated) return NextResponse.json({ error: "Could not update invitation.", detail: error?.message }, { status: 500 });
    await writeAudit({ tenantId: workspace.tenantId, candidateId: workspace.candidateId, action: "Update", module: "User Approval", recordId: updated.id, newValue: data });
    return NextResponse.json({ id: updated.id, status: data.status });
  }

  const { data: inserted, error } = await supabase.from(table).insert(payload).select("id").single();
  if (error || !inserted) {
    return NextResponse.json({ error: `Could not save ${name}.`, detail: error?.message }, { status: 500 });
  }

  await writeAudit({
    tenantId: workspace.tenantId,
    candidateId: workspace.candidateId,
    action: "Create",
    module: name,
    recordId: inserted.id,
    newValue: payload,
  });

  return NextResponse.json({ id: inserted.id, status: "Saved", reference: shortCode("JUK") });
}
