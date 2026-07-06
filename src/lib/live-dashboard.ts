import { getLooseSupabaseAdmin } from "@/lib/supabase";

type DbRow = Record<string, unknown>;

export type LiveSnapshot = {
  workspace: {
    tenantId: string;
    candidateId: string;
    memberId: string;
    role: string;
    isPlatformAdmin: boolean;
    access?: {
      allowed: boolean;
      status: string;
      reason: string;
      subscriptionStatus?: string | null;
      onboardingStatus?: string | null;
      paymentStatus?: string | null;
    };
  };
  campaign: DbRow | null;
  summary: {
    supporters: number;
    volunteers: number;
    pollingAgents: number;
    tasks: number;
    tasksCompleted: number;
    tasksOverdue: number;
    issues: number;
    events: number;
    payments: number;
    invitations: number;
    unreadNotifications: number;
    messagesOpen: number;
    aiContent: number;
  };
  livekit: {
    configured: boolean;
    urlLabel: string;
  };
  ai: {
    configured: boolean;
  };
  solcoIntegration: DbRow | null;
  supporters: DbRow[];
  volunteers: DbRow[];
  pollingAgents: DbRow[];
  tasks: DbRow[];
  fieldVisits: DbRow[];
  issues: DbRow[];
  events: DbRow[];
  notifications: DbRow[];
  communicationRooms: DbRow[];
  communicationMessages: DbRow[];
  aiContentAssets: DbRow[];
  auditLogs: DbRow[];
  invitations: DbRow[];
  pollingResults: DbRow[];
};

type SnapshotSession = {
  tenantId: string;
  candidateId: string;
  memberId: string;
  role: string;
  isPlatformAdmin: boolean;
};

async function fetchRows(table: string, tenantId: string, select = "*", limit = 100, order = "created_at", ascending = false): Promise<DbRow[]> {
  const admin = getLooseSupabaseAdmin();
  const { data } = await admin
    .from(table)
    .select(select)
    .eq("tenant_id", tenantId)
    .order(order, { ascending })
    .limit(limit);
  return Array.isArray(data) ? data as DbRow[] : [];
}

async function countRows(table: string, tenantId: string, predicate?: (row: DbRow) => boolean) {
  const rows = await fetchRows(table, tenantId, "id, status, due_date", 2000);
  return predicate ? rows.filter(predicate).length : rows.length;
}

export async function getLiveWorkspaceSnapshot(session: SnapshotSession, access?: LiveSnapshot["workspace"]["access"]): Promise<LiveSnapshot> {
  const tenantId = session.tenantId;
  const candidateId = session.candidateId;
  const admin = getLooseSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const [
    supporters,
    volunteers,
    pollingAgents,
    tasks,
    fieldVisits,
    issues,
    events,
    notifications,
    communicationRooms,
    communicationMessages,
    aiContentAssets,
    auditLogs,
    invitations,
    pollingResults,
    settingsResult,
    solcoResult,
    payments,
    supporterCount,
    volunteerCount,
    pollingAgentCount,
    taskCount,
    taskCompleteCount,
    taskOverdueCount,
    issueCount,
    eventCount,
    invitationCount,
    unreadNotificationCount,
    openMessageCount,
    aiContentCount,
  ] = await Promise.all([
    fetchRows("supporters", tenantId, "id, full_name, phone_number, gender, age_group, support_level, key_issue, volunteer_interest, created_at", 100),
    fetchRows("volunteers", tenantId, "id, full_name, phone_number, email, status, recruitment_source, join_date, notes, created_at", 100),
    fetchRows("polling_agents", tenantId, "id, full_name, phone_number, status, last_seen_at, created_at", 100),
    fetchRows("volunteer_tasks", tenantId, "id, title, description, status, due_date, created_at", 100),
    fetchRows("field_visits", tenantId, "id, visit_date, start_time, end_time, visit_purpose, supporters_engaged, notes, latitude, longitude, photos, created_at", 50, "visit_date"),
    fetchRows("community_issues", tenantId, "id, issue_title, category, description, priority_level, status, number_of_mentions, created_at", 100),
    fetchRows("campaign_events", tenantId, "id, title, type, venue, event_date, start_time, expected_attendance, description, created_at", 100, "event_date", true),
    fetchRows("internal_notifications", tenantId, "id, title, body, status, created_at", 50),
    fetchRows("communication_rooms", tenantId, "id, title, livekit_room_name, purpose, status, audience, scheduled_at, expected_participants, created_at", 50, "scheduled_at", false),
    fetchRows("communication_messages", tenantId, "id, channel, subject, audience, status, sent_at, created_at", 50, "created_at", false),
    fetchRows("ai_content_assets", tenantId, "id, asset_type, title, audience, status, created_at", 50),
    fetchRows("workspace_audit_logs", tenantId, "id, action, module, record_id, created_at", 50),
    fetchRows("invitations", tenantId, "id, invited_name, invited_phone, invited_email, role, status, expiry_date, created_at", 100),
    fetchRows("polling_results", tenantId, "id, candidate_name, votes, rejected_votes, total_votes, verification_status, created_at", 100),
    admin.from("campaign_settings").select("campaign_name, candidate_name, position_targeted, political_party, county, constituency, election_year, slogan, active_status").eq("tenant_id", tenantId).limit(1).maybeSingle(),
    admin.from("solco_integrations").select("workspace_url, livekit_url_label, token_endpoint, meeting_path, status").eq("tenant_id", tenantId).eq("candidate_id", candidateId).limit(1).maybeSingle(),
    countRows("workspace_activation_payments", tenantId),
    countRows("supporters", tenantId),
    countRows("volunteers", tenantId),
    countRows("polling_agents", tenantId),
    countRows("volunteer_tasks", tenantId),
    countRows("volunteer_tasks", tenantId, (row) => row.status === "Completed"),
    countRows("volunteer_tasks", tenantId, (row) => row.status !== "Completed" && String(row.due_date ?? "") < today),
    countRows("community_issues", tenantId),
    countRows("campaign_events", tenantId),
    countRows("invitations", tenantId),
    countRows("internal_notifications", tenantId, (row) => row.status === "Unread"),
    countRows("communication_messages", tenantId, (row) => row.status === "Draft" || row.status === "Queued"),
    countRows("ai_content_assets", tenantId),
  ]);

  const livekitConfigured = Boolean(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET);

  return {
    workspace: { ...session, access },
    campaign: settingsResult.data ?? null,
    summary: {
      supporters: supporterCount,
      volunteers: volunteerCount,
      pollingAgents: pollingAgentCount,
      tasks: taskCount,
      tasksCompleted: taskCompleteCount,
      tasksOverdue: taskOverdueCount,
      issues: issueCount,
      events: eventCount,
      payments,
      invitations: invitationCount,
      unreadNotifications: unreadNotificationCount,
      messagesOpen: openMessageCount,
      aiContent: aiContentCount,
    },
    livekit: {
      configured: livekitConfigured,
      urlLabel: livekitConfigured ? "Configured in Vercel environment" : "Missing LiveKit environment",
    },
    ai: {
      configured: Boolean(process.env.OPENAI_API_KEY),
    },
    solcoIntegration: solcoResult.data ?? null,
    supporters,
    volunteers,
    pollingAgents,
    tasks,
    fieldVisits,
    issues,
    events,
    notifications,
    communicationRooms,
    communicationMessages,
    aiContentAssets,
    auditLogs,
    invitations,
    pollingResults,
  };
}

function groupCount(rows: DbRow[], field: string) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = String(row[field] ?? "Not recorded");
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

export function reportRowsFromSnapshot(snapshot: LiveSnapshot, report: string): DbRow[] {
  if (report === "supporters-by-ward") return groupCount(snapshot.supporters, "ward_name");
  if (report === "supporters-by-polling-station") return groupCount(snapshot.supporters, "polling_station_name");
  if (report === "support-levels") return groupCount(snapshot.supporters, "support_level");
  if (report === "key-issues-analysis") return groupCount(snapshot.supporters, "key_issue");
  if (report === "volunteer-performance") {
    return snapshot.volunteers.map((volunteer) => ({
      name: volunteer.full_name,
      phone: volunteer.phone_number,
      status: volunteer.status,
      joined: volunteer.join_date ?? volunteer.created_at,
    }));
  }
  if (report === "territory-coverage") {
    return snapshot.fieldVisits.map((visit) => ({
      visitDate: visit.visit_date,
      purpose: visit.visit_purpose,
      supportersEngaged: visit.supporters_engaged,
      notes: visit.notes ?? "",
    }));
  }
  if (report === "community-issues") {
    return snapshot.issues.map((issue) => ({
      title: issue.issue_title,
      category: issue.category,
      priority: issue.priority_level,
      status: issue.status,
      mentions: issue.number_of_mentions,
      createdAt: issue.created_at,
    }));
  }
  if (report === "event-attendance") {
    return snapshot.events.map((event) => ({
      title: event.title,
      type: event.type,
      venue: event.venue,
      date: event.event_date,
      expectedAttendance: event.expected_attendance,
    }));
  }
  if (report === "communication-rooms") return snapshot.communicationRooms;
  if (report === "communication-messages") return snapshot.communicationMessages;
  if (report === "ai-recommendations") return snapshot.aiContentAssets;
  if (report === "pvt") return snapshot.pollingResults;
  if (report === "security-events") return snapshot.auditLogs;
  if (report === "ward-activity" || report === "ground-intelligence-summary") {
    return [
      { metric: "Supporters", value: snapshot.summary.supporters },
      { metric: "Volunteers", value: snapshot.summary.volunteers },
      { metric: "Polling agents", value: snapshot.summary.pollingAgents },
      { metric: "Tasks", value: snapshot.summary.tasks },
      { metric: "Issues", value: snapshot.summary.issues },
      { metric: "Events", value: snapshot.summary.events },
    ];
  }
  return [
    { metric: "Supporters", value: snapshot.summary.supporters },
    { metric: "Volunteers", value: snapshot.summary.volunteers },
    { metric: "Issues", value: snapshot.summary.issues },
    { metric: "Events", value: snapshot.summary.events },
  ];
}
