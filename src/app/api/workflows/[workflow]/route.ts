import { NextResponse } from "next/server";
import { z } from "zod";
import { getLooseSupabaseAdmin } from "@/lib/supabase";
import { shortCode, writeAudit } from "@/lib/server-workflows";
import { enforceRateLimit, requestKey } from "@/lib/rate-limit";
import { requireSession } from "@/lib/auth-session";

const workflowSchemas = {
  supporter: z.object({
    supporterId: z.string().uuid().optional(),
    fullName: z.string().trim().min(2),
    phoneNumber: z.string().trim().min(7),
    supportLevel: z.enum(["Strong Supporter", "Leaning Supporter", "Undecided", "Opponent", "Unknown"]).default("Unknown"),
    keyIssue: z.string().trim().optional().or(z.literal("")),
    countyName: z.string().trim().optional().or(z.literal("")),
    constituencyName: z.string().trim().optional().or(z.literal("")),
    wardName: z.string().trim().optional().or(z.literal("")),
    villageName: z.string().trim().optional().or(z.literal("")),
    pollingStationName: z.string().trim().optional().or(z.literal("")),
    pollingStationId: z.string().uuid().optional().or(z.literal("")),
    consentToContact: z.boolean().default(true),
    notes: z.string().trim().optional().or(z.literal("")),
  }),
  volunteer: z.object({
    fullName: z.string().trim().min(2),
    phoneNumber: z.string().trim().min(7),
    email: z.string().trim().email().optional().or(z.literal("")),
    notes: z.string().trim().optional().or(z.literal("")),
  }),
  volunteerStatus: z.object({
    volunteerId: z.string().uuid(),
    status: z.enum(["Active", "Inactive", "Suspended", "Pending Approval"]),
  }),
  task: z.object({
    title: z.string().trim().min(2),
    description: z.string().trim().optional().or(z.literal("")),
    dueDate: z.string().trim().min(8),
    assigneeType: z.enum(["Volunteer", "Campaign Member", "Polling Agent"]).default("Volunteer"),
    assigneeId: z.string().trim().optional().or(z.literal("")),
    assigneeLabel: z.string().trim().optional().or(z.literal("")),
  }),
  pollingAgent: z.object({
    sourceType: z.enum(["Supporter", "Volunteer", "Campaign Member", "Manual"]).default("Manual"),
    sourceId: z.string().trim().optional().or(z.literal("")),
    fullName: z.string().trim().min(2),
    phoneNumber: z.string().trim().min(7),
    pollingStationId: z.string().uuid(),
  }),
  supporterRole: z.object({
    supporterId: z.string().uuid(),
    targetRole: z.enum(["Volunteer", "Polling Agent", "Ward Coordinator", "Village Coordinator", "Constituency Coordinator", "Campaign Manager", "Data Clerk"]).default("Volunteer"),
    pollingStationId: z.string().uuid().optional().or(z.literal("")),
    notes: z.string().trim().optional().or(z.literal("")),
  }),
  issue: z.object({
    title: z.string().trim().min(2),
    category: z.enum(["Roads", "Water", "Education", "Healthcare", "Agriculture", "Youth Employment", "Security", "Electricity", "Business", "Environment", "Other"]).default("Other"),
    description: z.string().trim().optional().or(z.literal("")),
    countyName: z.string().trim().optional().or(z.literal("")),
    constituencyName: z.string().trim().optional().or(z.literal("")),
    wardName: z.string().trim().optional().or(z.literal("")),
    villageName: z.string().trim().optional().or(z.literal("")),
    pollingStationName: z.string().trim().optional().or(z.literal("")),
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
    countyName: z.string().trim().optional().or(z.literal("")),
    constituencyName: z.string().trim().optional().or(z.literal("")),
    wardName: z.string().trim().optional().or(z.literal("")),
    villageName: z.string().trim().optional().or(z.literal("")),
    pollingStationName: z.string().trim().optional().or(z.literal("")),
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
  communicationRoom: z.object({
    title: z.string().trim().min(2),
    purpose: z.enum(["Command Briefing", "Volunteer Coordination", "Ward Town Hall", "Candidate Broadcast"]).default("Command Briefing"),
    audience: z.string().trim().min(2),
    scheduledAt: z.string().trim().optional().or(z.literal("")),
    expectedParticipants: z.coerce.number().int().min(0).default(0),
  }),
  communicationMessage: z.object({
    channel: z.enum(["Solco Meeting", "Campaign Chat", "Broadcast SMS", "WhatsApp"]).default("Campaign Chat"),
    subject: z.string().trim().min(2),
    body: z.string().trim().optional().or(z.literal("")),
    audience: z.string().trim().min(2),
    recipientPhones: z.array(z.string().trim()).default([]),
    recipientMemberIds: z.array(z.string().trim()).default([]),
    meetingUrl: z.string().trim().optional().or(z.literal("")),
    callType: z.enum(["Message", "Voice Call", "Video Meeting", "Broadcast"]).default("Message"),
    status: z.enum(["Draft", "Queued", "Sent", "Delivered"]).default("Draft"),
  }),
  issueStatus: z.object({
    issueId: z.string().uuid(),
    status: z.enum(["Open", "Under Review", "Addressed"]),
  }),
  poll: z.object({
    title: z.string().trim().min(3),
    description: z.string().trim().optional().or(z.literal("")),
    pollType: z.enum(["Issue Pulse", "Approval Pulse", "Message Test", "Service Delivery Survey", "Volunteer Feedback", "Internal Tracking Poll"]).default("Issue Pulse"),
    visibility: z.enum(["Private Draft", "Campaign Team", "Field Agents", "Public Link"]).default("Campaign Team"),
    status: z.enum(["Draft", "Scheduled", "Active", "Closed"]).default("Draft"),
    startDate: z.string().trim().optional().or(z.literal("")),
    endDate: z.string().trim().optional().or(z.literal("")),
    targetResponseCount: z.coerce.number().int().min(0).default(100),
    allowAnonymous: z.boolean().default(true),
    requireConsent: z.boolean().default(true),
    collectLocation: z.boolean().default(true),
    collectDemographics: z.boolean().default(true),
    methodologyNote: z.string().trim().optional().or(z.literal("")),
    questions: z.array(z.object({
      questionText: z.string().trim().min(3),
      questionType: z.enum(["single_choice", "multiple_choice", "text", "rating", "yes_no"]).default("single_choice"),
      required: z.boolean().default(true),
      options: z.array(z.string().trim().min(1)).default([]),
    })).min(1).max(10),
  }),
  pollResponse: z.object({
    pollId: z.string().uuid(),
    respondentName: z.string().trim().optional().or(z.literal("")),
    phoneNumber: z.string().trim().optional().or(z.literal("")),
    collectionMethod: z.enum(["Public Link", "Field Agent", "Phone Call", "Door-to-door", "Team Entry"]).default("Field Agent"),
    countyName: z.string().trim().optional().or(z.literal("")),
    constituencyName: z.string().trim().optional().or(z.literal("")),
    wardName: z.string().trim().optional().or(z.literal("")),
    villageName: z.string().trim().optional().or(z.literal("")),
    pollingStationName: z.string().trim().optional().or(z.literal("")),
    pollingStationId: z.string().uuid().optional().or(z.literal("")),
    ageGroup: z.string().trim().optional().or(z.literal("")),
    gender: z.string().trim().optional().or(z.literal("")),
    consentToProcess: z.boolean().default(true),
    answers: z.array(z.object({
      questionId: z.string().uuid(),
      optionId: z.string().uuid().optional().or(z.literal("")),
      textAnswer: z.string().trim().optional().or(z.literal("")),
      numericAnswer: z.coerce.number().optional(),
      rankingValue: z.coerce.number().int().optional(),
    })).min(1),
  }),
  pollAction: z.object({
    pollId: z.string().uuid().optional().or(z.literal("")),
    title: z.string().trim().min(3),
    description: z.string().trim().optional().or(z.literal("")),
    insightCategory: z.enum(["Support", "Issues", "Messaging", "Turnout", "Risk", "Field Ops"]).default("Issues"),
    priority: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
    status: z.enum(["Open", "In Progress", "Resolved", "Archived"]).default("Open"),
    assignedTeam: z.string().trim().optional().or(z.literal("")),
    dueDate: z.string().trim().optional().or(z.literal("")),
    countyName: z.string().trim().optional().or(z.literal("")),
    constituencyName: z.string().trim().optional().or(z.literal("")),
    wardName: z.string().trim().optional().or(z.literal("")),
    villageName: z.string().trim().optional().or(z.literal("")),
    pollingStationName: z.string().trim().optional().or(z.literal("")),
  }),
  pollStatus: z.object({
    pollId: z.string().uuid(),
    status: z.enum(["Draft", "Scheduled", "Active", "Closed", "Archived"]),
    visibility: z.enum(["Private Draft", "Campaign Team", "Field Agents", "Public Link"]).optional(),
  }),
} as const;

type WorkflowName = keyof typeof workflowSchemas;

const workflowRoles: Record<WorkflowName, string[]> = {
  supporter: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Village Coordinator", "Volunteer", "Polling Agent", "Data Clerk", "Admin"],
  volunteer: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Admin"],
  volunteerStatus: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Admin"],
  task: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Admin"],
  pollingAgent: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Admin"],
  supporterRole: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Admin"],
  issue: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Village Coordinator", "Volunteer", "Polling Agent", "Admin"],
  event: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Admin"],
  fieldVisit: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Village Coordinator", "Volunteer", "Admin"],
  result: ["Candidate", "Campaign Manager", "Polling Agent", "Data Clerk", "Admin"],
  payment: ["Candidate", "Campaign Manager", "Admin"],
  userStatus: ["Candidate", "Campaign Manager", "Admin"],
  supportTicket: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Village Coordinator", "Volunteer", "Polling Agent", "Media Team", "Data Clerk", "Admin"],
  aiContent: ["Candidate", "Campaign Manager", "Media Team", "Admin"],
  communicationRoom: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Media Team", "Admin"],
  communicationMessage: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Media Team", "Admin"],
  issueStatus: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Admin"],
  poll: ["Candidate", "Campaign Manager", "Admin", "Media Team", "Data Clerk"],
  pollResponse: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Village Coordinator", "Volunteer", "Polling Agent", "Data Clerk", "Admin"],
  pollAction: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Admin", "Data Clerk"],
  pollStatus: ["Candidate", "Campaign Manager", "Admin", "Media Team", "Data Clerk"],
};

async function firstId(table: string, tenantId: string, column = "id") {
  const { data } = await getLooseSupabaseAdmin().from(table).select(column).eq("tenant_id", tenantId).limit(1).maybeSingle();
  return data?.[column] as string | undefined;
}

async function ensureTaskPoolVolunteer(tenantId: string, candidateId: string) {
  const supabase = getLooseSupabaseAdmin();
  const phoneNumber = `TASK-POOL-${candidateId.slice(0, 8)}`;
  const { data: existing } = await supabase
    .from("volunteers")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("phone_number", phoneNumber)
    .limit(1)
    .maybeSingle();
  if (existing?.id) return String(existing.id);

  const { data, error } = await supabase
    .from("volunteers")
    .insert({
      tenant_id: tenantId,
      candidate_id: candidateId,
      full_name: "Workspace Task Pool",
      phone_number: phoneNumber,
      recruitment_source: "System",
      status: "Active",
      notes: "System assignee used when tasks are assigned to campaign members or polling agents.",
    })
    .select("id")
    .single();
  if (error || !data?.id) throw new Error(error?.message ?? "Could not prepare task assignment pool.");
  return String(data.id);
}

type LocationScope = {
  countyId?: string;
  constituencyId?: string;
  wardId?: string;
  villageId?: string;
  pollingStationId?: string;
};

async function ensureLocationRow(
  table: string,
  tenantId: string,
  name: string,
  parent: Record<string, string> = {},
) {
  if (!name.trim()) return undefined;
  const supabase = getLooseSupabaseAdmin();
  let query = supabase.from(table).select("id").eq("tenant_id", tenantId).eq("name", name.trim()).limit(1);
  for (const [key, value] of Object.entries(parent)) query = query.eq(key, value);

  const { data: existing } = await query.maybeSingle();
  if (existing?.id) return String(existing.id);

  const { data, error } = await supabase
    .from(table)
    .insert({ tenant_id: tenantId, name: name.trim(), ...parent })
    .select("id")
    .single();
  if (error || !data?.id) throw new Error(error?.message ?? `Could not create ${table} location row.`);
  return String(data.id);
}

async function ensureWorkspaceLocation(tenantId: string, input: { countyName?: string; constituencyName?: string; wardName?: string; villageName?: string; pollingStationName?: string }): Promise<LocationScope> {
  const supabase = getLooseSupabaseAdmin();
  const { data: settings } = await supabase
    .from("campaign_settings")
    .select("county, constituency")
    .eq("tenant_id", tenantId)
    .limit(1)
    .maybeSingle();

  const countyName = input.countyName?.trim() || (typeof settings?.county === "string" ? settings.county : "");
  const constituencyName = input.constituencyName?.trim() || (typeof settings?.constituency === "string" ? settings.constituency : "");
  const wardName = input.wardName?.trim() ?? "";
  const villageName = input.villageName?.trim() ?? "";
  const pollingStationName = input.pollingStationName?.trim() ?? "";
  const countryId = await ensureLocationRow("countries", tenantId, "Kenya", { code: "KE" });
  const countyId = countyName && countryId ? await ensureLocationRow("counties", tenantId, countyName, { country_id: countryId }) : undefined;
  const constituencyId = constituencyName && countyId ? await ensureLocationRow("constituencies", tenantId, constituencyName, { county_id: countyId }) : undefined;
  const wardId = wardName && constituencyId ? await ensureLocationRow("wards", tenantId, wardName, { constituency_id: constituencyId }) : undefined;
  const villageId = (villageName || pollingStationName) && wardId ? await ensureLocationRow("villages", tenantId, villageName || "General", { ward_id: wardId }) : undefined;
  const pollingStationId = pollingStationName && villageId ? await ensureLocationRow("polling_stations", tenantId, pollingStationName, { village_id: villageId }) : undefined;

  return { countyId, constituencyId, wardId, villageId, pollingStationId };
}

async function supporterLocationScope(
  tenantId: string,
  input: { countyName?: string; constituencyName?: string; wardName?: string; villageName?: string; pollingStationName?: string; pollingStationId?: string },
) {
  if (input.pollingStationId && z.string().uuid().safeParse(input.pollingStationId).success) {
    return stationLocationScope(tenantId, input.pollingStationId);
  }
  return ensureWorkspaceLocation(tenantId, input);
}

async function stationLocationScope(tenantId: string, pollingStationId: string): Promise<LocationScope> {
  const supabase = getLooseSupabaseAdmin();
  const { data: station } = await supabase
    .from("polling_stations")
    .select("id, village_id")
    .eq("tenant_id", tenantId)
    .eq("id", pollingStationId)
    .limit(1)
    .maybeSingle();
  if (!station?.id) throw new Error("Polling station is not in this workspace.");

  const { data: village } = await supabase.from("villages").select("id, ward_id").eq("tenant_id", tenantId).eq("id", station.village_id).limit(1).maybeSingle();
  const { data: ward } = village?.ward_id ? await supabase.from("wards").select("id, constituency_id").eq("tenant_id", tenantId).eq("id", village.ward_id).limit(1).maybeSingle() : { data: null };
  const { data: constituency } = ward?.constituency_id ? await supabase.from("constituencies").select("id, county_id").eq("tenant_id", tenantId).eq("id", ward.constituency_id).limit(1).maybeSingle() : { data: null };

  return {
    countyId: constituency?.county_id ? String(constituency.county_id) : undefined,
    constituencyId: ward?.constituency_id ? String(ward.constituency_id) : undefined,
    wardId: village?.ward_id ? String(village.ward_id) : undefined,
    villageId: station.village_id ? String(station.village_id) : undefined,
    pollingStationId: String(station.id),
  };
}

function memberEmailForPhone(phoneNumber: string, supporterId: string) {
  const digits = phoneNumber.replace(/\D/g, "");
  return `${digits || supporterId.replace(/-/g, "").slice(0, 12)}@phone.jukwaa.local`;
}

async function upsertCampaignMemberFromSupporter(input: {
  tenantId: string;
  candidateId: string;
  supporter: Record<string, unknown>;
  role: string;
  location: LocationScope;
  invitedBy?: string | null;
}) {
  const supabase = getLooseSupabaseAdmin();
  const email = memberEmailForPhone(String(input.supporter.phone_number ?? ""), String(input.supporter.id));
  const payload = {
    tenant_id: input.tenantId,
    candidate_id: input.candidateId,
    email,
    full_name: String(input.supporter.full_name ?? "Campaign member"),
    role: input.role,
    status: "Active",
    assigned_country_id: null,
    assigned_county_id: input.location.countyId ?? input.supporter.county_id ?? null,
    assigned_constituency_id: input.location.constituencyId ?? input.supporter.constituency_id ?? null,
    assigned_ward_id: input.location.wardId ?? input.supporter.ward_id ?? null,
    assigned_village_id: input.location.villageId ?? input.supporter.village_id ?? null,
    assigned_polling_station_id: input.location.pollingStationId ?? input.supporter.polling_station_id ?? null,
  };

  const { data: existing } = await supabase
    .from("campaign_members")
    .select("id")
    .eq("tenant_id", input.tenantId)
    .eq("email", email)
    .limit(1)
    .maybeSingle();
  const mutation = existing?.id
    ? supabase.from("campaign_members").update(payload).eq("tenant_id", input.tenantId).eq("id", existing.id).select("id").single()
    : supabase.from("campaign_members").insert(payload).select("id").single();
  const { data, error } = await mutation;
  if (error || !data?.id) throw new Error(error?.message ?? "Could not create campaign member role.");
  return { id: String(data.id), email, role: input.role };
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
    const location = await supporterLocationScope(workspace.tenantId, data);
    table = "supporters";
    payload = {
      tenant_id: workspace.tenantId,
      candidate_id: workspace.candidateId,
      full_name: data.fullName,
      phone_number: data.phoneNumber,
      county_id: location.countyId ?? null,
      constituency_id: location.constituencyId ?? null,
      ward_id: location.wardId ?? null,
      village_id: location.villageId ?? null,
      polling_station_id: location.pollingStationId ?? null,
      support_level: data.supportLevel,
      key_issue: data.keyIssue || null,
      consent_to_contact: data.consentToContact,
      notes: data.notes || null,
    };

    if (data.supporterId) {
      const { data: updated, error } = await supabase
        .from(table)
        .update(payload)
        .eq("id", data.supporterId)
        .eq("tenant_id", workspace.tenantId)
        .eq("candidate_id", workspace.candidateId)
        .select("id, full_name, phone_number, support_level, key_issue, volunteer_interest, created_at")
        .single();
      if (error || !updated) {
        return NextResponse.json({ error: "Could not update supporter.", detail: error?.message }, { status: 500 });
      }
      await writeAudit({
        tenantId: workspace.tenantId,
        candidateId: workspace.candidateId,
        action: "Update",
        module: name,
        recordId: updated.id,
        newValue: payload,
      });
      return NextResponse.json({
        id: updated.id,
        status: "Saved",
        reference: shortCode("JUK"),
        supporter: {
          ...updated,
          county_name: data.countyName || "",
          constituency_name: data.constituencyName || "",
          ward_name: data.wardName || "",
          village_name: data.villageName || "",
          polling_station_name: data.pollingStationName || "",
        },
      });
    }
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
      status: "Active",
      notes: data.notes || null,
    };
  }

  if (name === "volunteerStatus") {
    const data = parsed.data as z.infer<typeof workflowSchemas.volunteerStatus>;
    const { data: updated, error } = await supabase
      .from("volunteers")
      .update({ status: data.status })
      .eq("id", data.volunteerId)
      .eq("tenant_id", workspace.tenantId)
      .eq("candidate_id", workspace.candidateId)
      .select("id, full_name, status")
      .single();
    if (error || !updated) {
      return NextResponse.json({ error: "Could not update volunteer status.", detail: error?.message }, { status: 500 });
    }
    await writeAudit({
      tenantId: workspace.tenantId,
      candidateId: workspace.candidateId,
      action: "Update",
      module: "Volunteer Approval",
      recordId: updated.id,
      newValue: data,
    });
    return NextResponse.json({ id: updated.id, status: data.status });
  }

  if (name === "task") {
    const data = parsed.data as z.infer<typeof workflowSchemas.task>;
    const selectedId = data.assigneeId?.trim();
    const volunteerId = data.assigneeType === "Volunteer" && selectedId
      ? selectedId
      : data.assigneeType === "Volunteer"
        ? await firstId("volunteers", workspace.tenantId)
        : await ensureTaskPoolVolunteer(workspace.tenantId, workspace.candidateId);
    if (!volunteerId) return NextResponse.json({ error: "Create a volunteer or choose a team member before assigning a task." }, { status: 409 });
    table = "volunteer_tasks";
    payload = {
      tenant_id: workspace.tenantId,
      candidate_id: workspace.candidateId,
      task_type: "Door-to-door campaign",
      title: data.title,
      description: data.description || null,
      assigned_to: volunteerId,
      assigned_member_id: data.assigneeType === "Campaign Member" && selectedId ? selectedId : null,
      assigned_polling_agent_id: data.assigneeType === "Polling Agent" && selectedId ? selectedId : null,
      assignee_type: data.assigneeType,
      assignee_label: data.assigneeLabel || null,
      assigned_by: auth.session.userId || null,
      due_date: data.dueDate,
      status: "Pending",
    };
  }

  if (name === "pollingAgent") {
    const data = parsed.data as z.infer<typeof workflowSchemas.pollingAgent>;
    let location: LocationScope;
    try {
      location = await stationLocationScope(workspace.tenantId, data.pollingStationId);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Polling station is not in this workspace." }, { status: 400 });
    }

    payload = {
      tenant_id: workspace.tenantId,
      candidate_id: workspace.candidateId,
      full_name: data.fullName,
      phone_number: data.phoneNumber,
      assigned_county_id: location.countyId ?? null,
      assigned_constituency_id: location.constituencyId ?? null,
      assigned_ward_id: location.wardId ?? null,
      assigned_polling_station_id: location.pollingStationId ?? null,
      reporting_manager: auth.session.memberId || null,
      status: "Assigned",
    };

    const { data: existing } = await supabase
      .from("polling_agents")
      .select("id")
      .eq("tenant_id", workspace.tenantId)
      .eq("phone_number", data.phoneNumber)
      .limit(1)
      .maybeSingle();
    const mutation = existing?.id
      ? supabase.from("polling_agents").update(payload).eq("tenant_id", workspace.tenantId).eq("id", existing.id).select("id").single()
      : supabase.from("polling_agents").insert(payload).select("id").single();
    const { data: saved, error } = await mutation;
    if (error || !saved) return NextResponse.json({ error: "Could not assign polling agent.", detail: error?.message }, { status: 500 });
    await writeAudit({ tenantId: workspace.tenantId, candidateId: workspace.candidateId, action: existing?.id ? "Update" : "Create", module: "pollingAgent", recordId: saved.id, newValue: { ...payload, sourceType: data.sourceType, sourceId: data.sourceId || null } });
    return NextResponse.json({ id: saved.id, status: "Saved" });
  }

  if (name === "supporterRole") {
    const data = parsed.data as z.infer<typeof workflowSchemas.supporterRole>;
    const { data: supporter, error: supporterError } = await supabase
      .from("supporters")
      .select("id, full_name, phone_number, county_id, constituency_id, ward_id, village_id, polling_station_id")
      .eq("id", data.supporterId)
      .eq("tenant_id", workspace.tenantId)
      .eq("candidate_id", workspace.candidateId)
      .limit(1)
      .maybeSingle();
    if (supporterError || !supporter?.id) {
      return NextResponse.json({ error: "Supporter was not found in this workspace.", detail: supporterError?.message }, { status: 404 });
    }

    const location = data.pollingStationId && z.string().uuid().safeParse(data.pollingStationId).success
      ? await stationLocationScope(workspace.tenantId, data.pollingStationId)
      : {
          countyId: supporter.county_id ? String(supporter.county_id) : undefined,
          constituencyId: supporter.constituency_id ? String(supporter.constituency_id) : undefined,
          wardId: supporter.ward_id ? String(supporter.ward_id) : undefined,
          villageId: supporter.village_id ? String(supporter.village_id) : undefined,
          pollingStationId: supporter.polling_station_id ? String(supporter.polling_station_id) : undefined,
        };
    const assignments: Array<{ type: string; id: string; role?: string; email?: string }> = [];

    if (data.targetRole === "Volunteer") {
      const volunteerPayload = {
        tenant_id: workspace.tenantId,
        candidate_id: workspace.candidateId,
        full_name: supporter.full_name,
        phone_number: supporter.phone_number,
        county_id: location.countyId ?? null,
        constituency_id: location.constituencyId ?? null,
        ward_id: location.wardId ?? null,
        village_id: location.villageId ?? null,
        recruitment_source: "Supporter Promotion",
        status: "Active",
        notes: data.notes || "Promoted from supporter register.",
      };
      const { data: existingVolunteer } = await supabase.from("volunteers").select("id").eq("tenant_id", workspace.tenantId).eq("phone_number", supporter.phone_number).limit(1).maybeSingle();
      const mutation = existingVolunteer?.id
        ? supabase.from("volunteers").update(volunteerPayload).eq("tenant_id", workspace.tenantId).eq("id", existingVolunteer.id).select("id").single()
        : supabase.from("volunteers").insert(volunteerPayload).select("id").single();
      const { data: volunteer, error } = await mutation;
      if (error || !volunteer?.id) return NextResponse.json({ error: "Could not promote supporter to volunteer.", detail: error?.message }, { status: 500 });
      assignments.push({ type: "Volunteer", id: String(volunteer.id) });
    }

    if (data.targetRole === "Polling Agent") {
      if (!location.pollingStationId) {
        return NextResponse.json({ error: "Choose a polling station before assigning a polling agent." }, { status: 400 });
      }
      const agentPayload = {
        tenant_id: workspace.tenantId,
        candidate_id: workspace.candidateId,
        full_name: supporter.full_name,
        phone_number: supporter.phone_number,
        assigned_county_id: location.countyId ?? null,
        assigned_constituency_id: location.constituencyId ?? null,
        assigned_ward_id: location.wardId ?? null,
        assigned_polling_station_id: location.pollingStationId,
        reporting_manager: auth.session.memberId || null,
        status: "Assigned",
      };
      const { data: existingAgent } = await supabase.from("polling_agents").select("id").eq("tenant_id", workspace.tenantId).eq("phone_number", supporter.phone_number).limit(1).maybeSingle();
      const mutation = existingAgent?.id
        ? supabase.from("polling_agents").update(agentPayload).eq("tenant_id", workspace.tenantId).eq("id", existingAgent.id).select("id").single()
        : supabase.from("polling_agents").insert(agentPayload).select("id").single();
      const { data: agent, error } = await mutation;
      if (error || !agent?.id) return NextResponse.json({ error: "Could not assign polling agent.", detail: error?.message }, { status: 500 });
      assignments.push({ type: "Polling Agent", id: String(agent.id) });
    }

    const memberRole = await upsertCampaignMemberFromSupporter({
      tenantId: workspace.tenantId,
      candidateId: workspace.candidateId,
      supporter,
      role: data.targetRole,
      location,
      invitedBy: auth.session.memberId,
    });
    assignments.push({ type: "Campaign Member", ...memberRole });

    await supabase
      .from("supporters")
      .update({
        volunteer_interest: data.targetRole === "Volunteer" ? true : undefined,
        notes: data.notes || `Reassigned as ${data.targetRole}.`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.supporterId)
      .eq("tenant_id", workspace.tenantId)
      .eq("candidate_id", workspace.candidateId);
    await writeAudit({ tenantId: workspace.tenantId, candidateId: workspace.candidateId, action: "Update", module: "supporterRole", recordId: data.supporterId, newValue: { targetRole: data.targetRole, assignments } });
    return NextResponse.json({ id: data.supporterId, status: "Saved", assignments });
  }

  if (name === "issue") {
    const data = parsed.data as z.infer<typeof workflowSchemas.issue>;
    const location = await ensureWorkspaceLocation(workspace.tenantId, data);
    table = "community_issues";
    payload = {
      tenant_id: workspace.tenantId,
      candidate_id: workspace.candidateId,
      issue_title: data.title,
      category: data.category,
      description: data.description || null,
      ward_id: location.wardId ?? null,
      village_id: location.villageId ?? null,
      polling_station_id: location.pollingStationId ?? null,
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
    const location = await ensureWorkspaceLocation(workspace.tenantId, data);
    table = "field_visits";
    payload = {
      tenant_id: workspace.tenantId,
      candidate_id: workspace.candidateId,
      volunteer_id: volunteerId,
      visit_date: new Date().toISOString().slice(0, 10),
      start_time: "09:00",
      village_id: location.villageId ?? null,
      polling_station_id: location.pollingStationId ?? null,
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

  if (name === "communicationRoom") {
    const data = parsed.data as z.infer<typeof workflowSchemas.communicationRoom>;
    table = "communication_rooms";
    payload = {
      tenant_id: workspace.tenantId,
      candidate_id: workspace.candidateId,
      title: data.title,
      livekit_room_name: `${shortCode("jukwaa-room").toLowerCase()}-${data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42) || "room"}`,
      purpose: data.purpose,
      status: "Scheduled",
      audience: data.audience,
      scheduled_at: data.scheduledAt || null,
      expected_participants: data.expectedParticipants,
      host_member_id: auth.session.memberId || null,
    };
  }

  if (name === "communicationMessage") {
    const data = parsed.data as z.infer<typeof workflowSchemas.communicationMessage>;
    table = "communication_messages";
    payload = {
      tenant_id: workspace.tenantId,
      candidate_id: workspace.candidateId,
      channel: data.channel,
      subject: data.subject,
      sender_member_id: auth.session.memberId || null,
      audience: data.audience,
      body: data.body || null,
      recipient_phones: data.recipientPhones,
      recipient_member_ids: data.recipientMemberIds,
      meeting_url: data.meetingUrl || null,
      call_type: data.callType,
      status: data.status,
      delivery_status: data.status === "Sent" || data.status === "Delivered" ? data.status : "Not Sent",
      sent_at: data.status === "Sent" || data.status === "Delivered" ? new Date().toISOString() : null,
    };
  }

  if (name === "poll") {
    const data = parsed.data as z.infer<typeof workflowSchemas.poll>;
    const { data: poll, error } = await supabase
      .from("polls")
      .insert({
        tenant_id: workspace.tenantId,
        candidate_id: workspace.candidateId,
        title: data.title,
        description: data.description || null,
        poll_type: data.pollType,
        status: data.status,
        visibility: data.visibility,
        start_date: data.startDate || null,
        end_date: data.endDate || null,
        target_response_count: data.targetResponseCount,
        allow_anonymous: data.allowAnonymous,
        require_consent: data.requireConsent,
        collect_location: data.collectLocation,
        collect_demographics: data.collectDemographics,
        methodology_note: data.methodologyNote || null,
        created_by_member_id: auth.session.memberId || null,
      })
      .select("id")
      .single();
    if (error || !poll?.id) return NextResponse.json({ error: "Could not create poll.", detail: error?.message }, { status: 500 });

    for (const [questionIndex, question] of data.questions.entries()) {
      const { data: savedQuestion, error: questionError } = await supabase
        .from("poll_questions")
        .insert({
          tenant_id: workspace.tenantId,
          poll_id: poll.id,
          question_text: question.questionText,
          question_type: question.questionType,
          required: question.required,
          display_order: questionIndex + 1,
        })
        .select("id")
        .single();
      if (questionError || !savedQuestion?.id) return NextResponse.json({ error: "Poll was created, but a question could not be saved.", detail: questionError?.message }, { status: 500 });

      const options = question.options
        .map((option) => option.trim())
        .filter(Boolean)
        .map((optionText, optionIndex) => ({
          tenant_id: workspace.tenantId,
          question_id: savedQuestion.id,
          option_text: optionText,
          sentiment_score: /support|approve|good|yes|strong/i.test(optionText) ? 1 : /oppose|bad|no|reject/i.test(optionText) ? -1 : 0,
          display_order: optionIndex + 1,
        }));
      if (options.length) {
        const { error: optionsError } = await supabase.from("poll_options").insert(options);
        if (optionsError) return NextResponse.json({ error: "Poll was created, but options could not be saved.", detail: optionsError.message }, { status: 500 });
      }
    }

    await writeAudit({ tenantId: workspace.tenantId, candidateId: workspace.candidateId, action: "Create", module: "poll", recordId: poll.id, newValue: data });
    return NextResponse.json({ id: poll.id, status: data.status, publicUrl: `/polls/${poll.id}`, reference: shortCode("PULSE") });
  }

  if (name === "pollResponse") {
    const data = parsed.data as z.infer<typeof workflowSchemas.pollResponse>;
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("id, require_consent")
      .eq("id", data.pollId)
      .eq("tenant_id", workspace.tenantId)
      .eq("candidate_id", workspace.candidateId)
      .limit(1)
      .maybeSingle();
    if (pollError || !poll?.id) return NextResponse.json({ error: "Poll was not found in this workspace.", detail: pollError?.message }, { status: 404 });
    if (poll.require_consent && !data.consentToProcess) return NextResponse.json({ error: "Consent is required before saving this response." }, { status: 400 });

    const location = data.pollingStationId && z.string().uuid().safeParse(data.pollingStationId).success
      ? await stationLocationScope(workspace.tenantId, data.pollingStationId)
      : await supporterLocationScope(workspace.tenantId, data);
    const { data: response, error } = await supabase
      .from("poll_responses")
      .insert({
        tenant_id: workspace.tenantId,
        candidate_id: workspace.candidateId,
        poll_id: data.pollId,
        respondent_name: data.respondentName || null,
        phone_number: data.phoneNumber || null,
        collection_method: data.collectionMethod,
        county_id: location.countyId ?? null,
        constituency_id: location.constituencyId ?? null,
        ward_id: location.wardId ?? null,
        village_id: location.villageId ?? null,
        polling_station_id: location.pollingStationId ?? null,
        age_group: data.ageGroup || null,
        gender: data.gender || null,
        consent_to_process: data.consentToProcess,
        submitted_by_member_id: auth.session.memberId || null,
      })
      .select("id")
      .single();
    if (error || !response?.id) return NextResponse.json({ error: "Could not save poll response.", detail: error?.message }, { status: 500 });

    const answers = data.answers.map((answer) => ({
      tenant_id: workspace.tenantId,
      response_id: response.id,
      poll_id: data.pollId,
      question_id: answer.questionId,
      option_id: answer.optionId || null,
      text_answer: answer.textAnswer || null,
      numeric_answer: answer.numericAnswer ?? null,
      ranking_value: answer.rankingValue ?? null,
    }));
    const { error: answerError } = await supabase.from("poll_answers").insert(answers);
    if (answerError) return NextResponse.json({ error: "Poll response was saved, but answers could not be saved.", detail: answerError.message }, { status: 500 });

    await writeAudit({ tenantId: workspace.tenantId, candidateId: workspace.candidateId, action: "Create", module: "pollResponse", recordId: response.id, newValue: { pollId: data.pollId, collectionMethod: data.collectionMethod } });
    return NextResponse.json({ id: response.id, status: "Submitted", reference: shortCode("PULSE") });
  }

  if (name === "pollAction") {
    const data = parsed.data as z.infer<typeof workflowSchemas.pollAction>;
    const location = await ensureWorkspaceLocation(workspace.tenantId, data);
    table = "poll_action_items";
    payload = {
      tenant_id: workspace.tenantId,
      candidate_id: workspace.candidateId,
      poll_id: data.pollId || null,
      title: data.title,
      description: data.description || null,
      insight_category: data.insightCategory,
      priority: data.priority,
      status: data.status,
      assigned_team: data.assignedTeam || null,
      due_date: data.dueDate || null,
      county_id: location.countyId ?? null,
      constituency_id: location.constituencyId ?? null,
      ward_id: location.wardId ?? null,
      village_id: location.villageId ?? null,
      polling_station_id: location.pollingStationId ?? null,
      created_by_member_id: auth.session.memberId || null,
    };
  }

  if (name === "pollStatus") {
    const data = parsed.data as z.infer<typeof workflowSchemas.pollStatus>;
    const updatePayload: Record<string, unknown> = { status: data.status, updated_at: new Date().toISOString() };
    if (data.visibility) updatePayload.visibility = data.visibility;
    const { data: updated, error } = await supabase
      .from("polls")
      .update(updatePayload)
      .eq("id", data.pollId)
      .eq("tenant_id", workspace.tenantId)
      .eq("candidate_id", workspace.candidateId)
      .select("id")
      .single();
    if (error || !updated) return NextResponse.json({ error: "Could not update poll status.", detail: error?.message }, { status: 500 });
    await writeAudit({ tenantId: workspace.tenantId, candidateId: workspace.candidateId, action: "Update", module: "pollStatus", recordId: updated.id, newValue: data });
    return NextResponse.json({ id: updated.id, status: data.status, visibility: data.visibility });
  }

  if (name === "issueStatus") {
    const data = parsed.data as z.infer<typeof workflowSchemas.issueStatus>;
    const { data: updated, error } = await supabase
      .from("community_issues")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.issueId)
      .eq("tenant_id", workspace.tenantId)
      .eq("candidate_id", workspace.candidateId)
      .select("id")
      .single();
    if (error || !updated) return NextResponse.json({ error: "Could not update issue status.", detail: error?.message }, { status: 500 });
    await writeAudit({ tenantId: workspace.tenantId, candidateId: workspace.candidateId, action: "Update", module: "issueStatus", recordId: updated.id, newValue: data });
    return NextResponse.json({ id: updated.id, status: "Saved" });
  }

  if (name === "userStatus") {
    const data = parsed.data as z.infer<typeof workflowSchemas.userStatus>;
    if (!data.invitationId || !z.string().uuid().safeParse(data.invitationId).success) {
      await writeAudit({ tenantId: workspace.tenantId, candidateId: workspace.candidateId, action: "Update", module: "User Approval", recordId: data.invitationId ?? "demo", newValue: data });
      return NextResponse.json({ id: data.invitationId ?? "demo", status: data.status, note: "Audit saved. Persisted invitation update requires a real invitation record." });
    }
    const { data: updated, error } = await supabase
      .from("invitations")
      .update({ status: data.status })
      .eq("id", data.invitationId)
      .eq("tenant_id", workspace.tenantId)
      .eq("candidate_id", workspace.candidateId)
      .select("id, role, invited_phone, invited_email")
      .single();
    if (error || !updated) return NextResponse.json({ error: "Could not update invitation.", detail: error?.message }, { status: 500 });
    const volunteerStatus = data.status === "Accepted" ? "Active" : data.status === "Pending" ? "Pending Approval" : "Inactive";
    const agentStatus = data.status === "Accepted" ? "Active" : data.status === "Pending" ? "Assigned" : "Offline";
    if (updated.role === "Volunteer" && (updated.invited_phone || updated.invited_email)) {
      let volunteerUpdate = supabase
        .from("volunteers")
        .update({ status: volunteerStatus })
        .eq("tenant_id", workspace.tenantId)
        .eq("candidate_id", workspace.candidateId);
      volunteerUpdate = updated.invited_phone
        ? volunteerUpdate.eq("phone_number", updated.invited_phone)
        : volunteerUpdate.eq("email", updated.invited_email);
      await volunteerUpdate;
    }
    if (updated.role === "Polling Agent" && updated.invited_phone) {
      await supabase
        .from("polling_agents")
        .update({ status: agentStatus })
        .eq("tenant_id", workspace.tenantId)
        .eq("candidate_id", workspace.candidateId)
        .eq("phone_number", updated.invited_phone);
    }
    await writeAudit({ tenantId: workspace.tenantId, candidateId: workspace.candidateId, action: "Update", module: "User Approval", recordId: updated.id, newValue: data });
    return NextResponse.json({ id: updated.id, status: data.status });
  }

  const selectColumns = name === "supporter"
    ? "id, full_name, phone_number, support_level, key_issue, volunteer_interest, created_at"
    : "id";
  const { data: inserted, error } = await supabase.from(table).insert(payload).select(selectColumns).single();
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

  return NextResponse.json({
    id: inserted.id,
    status: "Saved",
    reference: shortCode("JUK"),
    supporter: name === "supporter" ? {
      ...inserted,
      ward_name: (parsed.data as z.infer<typeof workflowSchemas.supporter>).wardName || "",
      village_name: (parsed.data as z.infer<typeof workflowSchemas.supporter>).villageName || "",
      polling_station_name: (parsed.data as z.infer<typeof workflowSchemas.supporter>).pollingStationName || "",
    } : undefined,
  });
}

export async function DELETE(request: Request, context: { params: Promise<{ workflow: string }> }) {
  const limited = await enforceRateLimit(requestKey(request, "workflow-delete"), 30, 60_000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many delete requests. Try again shortly." }, { status: 429 });
  }

  const { workflow } = await context.params;
  if (workflow !== "supporter") {
    return NextResponse.json({ error: "Unsupported delete workflow." }, { status: 404 });
  }

  const auth = await requireSession(request);
  if (auth.response) return auth.response;
  if (!["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Admin"].includes(auth.session.role) && !auth.session.isPlatformAdmin) {
    return NextResponse.json({ error: "You do not have permission to delete supporters." }, { status: 403 });
  }

  const supporterId = new URL(request.url).searchParams.get("supporterId") ?? "";
  if (!z.string().uuid().safeParse(supporterId).success) {
    return NextResponse.json({ error: "A valid supporter ID is required." }, { status: 400 });
  }

  const supabase = getLooseSupabaseAdmin();
  const { data: deleted, error } = await supabase
    .from("supporters")
    .delete()
    .eq("id", supporterId)
    .eq("tenant_id", auth.session.tenantId)
    .eq("candidate_id", auth.session.candidateId)
    .select("id, full_name, phone_number")
    .single();
  if (error || !deleted?.id) {
    return NextResponse.json({ error: "Could not delete supporter.", detail: error?.message }, { status: 500 });
  }
  await writeAudit({
    tenantId: auth.session.tenantId,
    candidateId: auth.session.candidateId,
    action: "Delete",
    module: "supporter",
    recordId: deleted.id,
    newValue: { deleted },
  });
  return NextResponse.json({ id: deleted.id, status: "Deleted" });
}
