import { NextResponse } from "next/server";
import { z } from "zod";
import { getLooseSupabaseAdmin } from "@/lib/supabase";
import { requireSession } from "@/lib/auth-session";
import { writeAudit } from "@/lib/server-workflows";

const actionSchema = z.object({
  action: z.enum([
    "Approve Workspace",
    "Confirm Payment",
    "Suspend Workspace",
    "Reactivate Workspace",
    "Cancel Subscription",
    "Mark Past Due",
    "Resolve Ticket",
    "Close Ticket",
  ]),
  applicationId: z.string().uuid().optional(),
  paymentId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  candidateId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional(),
  ticketId: z.string().uuid().optional(),
});

type CandidateRow = {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string | null;
  phone_number: string;
  campaign_name: string;
  position_contesting: string;
  political_party: string | null;
  active_status: string;
  verification_status: string;
  created_at: string;
};

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  is_demo: boolean;
  created_at: string;
};

type ApplicationRow = {
  id: string;
  tenant_id: string;
  candidate_id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  campaign_name: string;
  position_contesting: string;
  plan: string;
  amount_due_kes: number | string;
  status: string;
  payment_reference: string | null;
  submitted_at: string;
  activated_at: string | null;
};

type PaymentRow = {
  id: string;
  onboarding_application_id: string | null;
  tenant_id: string;
  candidate_id: string;
  phone_number: string;
  amount_kes: number | string;
  channel: string;
  account_reference: string;
  mpesa_receipt_number: string | null;
  status: string;
  submitted_at: string;
  confirmed_at: string | null;
};

type SubscriptionRow = {
  id: string;
  tenant_id: string;
  candidate_id: string;
  plan: string;
  start_date: string;
  expiry_date: string;
  status: string;
  user_limit: number;
  volunteer_limit: number;
  polling_agent_limit: number;
  storage_limit_gb: number;
  created_at: string;
};

type TicketRow = {
  id: string;
  tenant_id: string | null;
  candidate_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
};

type PlatformAdminRow = {
  id: string;
  email: string;
  full_name: string;
  status: string;
  created_at: string;
};

function rows<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

function row<T>(data: unknown): T | null {
  return data && !Array.isArray(data) ? (data as T) : null;
}

async function loadSaasSnapshot() {
  const admin = getLooseSupabaseAdmin();
  const [tenants, candidates, applications, payments, subscriptions, tickets, platformAdmins] = await Promise.all([
    admin.from("tenants").select("id, name, slug, is_demo, created_at").order("created_at", { ascending: false }),
    admin
      .from("candidates")
      .select("id, tenant_id, full_name, email, phone_number, campaign_name, position_contesting, political_party, active_status, verification_status, created_at")
      .order("created_at", { ascending: false }),
    admin
      .from("candidate_onboarding_applications")
      .select("id, tenant_id, candidate_id, full_name, phone_number, email, campaign_name, position_contesting, plan, amount_due_kes, status, payment_reference, submitted_at, activated_at")
      .order("submitted_at", { ascending: false }),
    admin
      .from("workspace_activation_payments")
      .select("id, onboarding_application_id, tenant_id, candidate_id, phone_number, amount_kes, channel, account_reference, mpesa_receipt_number, status, submitted_at, confirmed_at")
      .order("submitted_at", { ascending: false }),
    admin
      .from("workspace_subscriptions")
      .select("id, tenant_id, candidate_id, plan, start_date, expiry_date, status, user_limit, volunteer_limit, polling_agent_limit, storage_limit_gb, created_at")
      .order("created_at", { ascending: false }),
    admin
      .from("support_tickets")
      .select("id, tenant_id, candidate_id, title, description, status, priority, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("platform_admins").select("id, email, full_name, status, created_at").order("created_at", { ascending: false }),
  ]);

  const tenantRows = rows<TenantRow>(tenants.data);
  const candidateRows = rows<CandidateRow>(candidates.data);
  const applicationRows = rows<ApplicationRow>(applications.data);
  const paymentRows = rows<PaymentRow>(payments.data);
  const subscriptionRows = rows<SubscriptionRow>(subscriptions.data);
  const ticketRows = rows<TicketRow>(tickets.data);
  const platformAdminRows = rows<PlatformAdminRow>(platformAdmins.data);

  const workspaces = candidateRows.map((candidate) => {
    const application = applicationRows.find((item) => item.candidate_id === candidate.id);
    const subscription = subscriptionRows.find((item) => item.candidate_id === candidate.id);
    const workspacePayments = paymentRows.filter((item) => item.candidate_id === candidate.id);
    const confirmedPayment = workspacePayments.find((item) => item.status === "Confirmed");
    const pendingPayment = workspacePayments.find((item) => item.status === "Pending");
    const workspaceTickets = ticketRows.filter((item) => item.candidate_id === candidate.id);
    const locked = subscription?.status !== "Active" && application?.status !== "Activated" && !confirmedPayment;

    return {
      tenantId: candidate.tenant_id,
      candidateId: candidate.id,
      candidateName: candidate.full_name,
      email: candidate.email,
      phoneNumber: candidate.phone_number,
      campaignName: candidate.campaign_name,
      position: candidate.position_contesting,
      politicalParty: candidate.political_party,
      candidateStatus: candidate.active_status,
      verificationStatus: candidate.verification_status,
      createdAt: candidate.created_at,
      application,
      subscription,
      latestPayment: workspacePayments[0] ?? null,
      pendingPayment: pendingPayment ?? null,
      confirmedPayment: confirmedPayment ?? null,
      openTickets: workspaceTickets.filter((ticket) => !["Resolved", "Closed"].includes(ticket.status)).length,
      accessStatus: locked ? "Locked" : "Unlocked",
    };
  });

  const summary = {
    tenants: tenantRows.length,
    workspaces: workspaces.length,
    locked: workspaces.filter((workspace) => workspace.accessStatus === "Locked").length,
    activeSubscriptions: subscriptionRows.filter((subscription) => subscription.status === "Active").length,
    pendingPayments: paymentRows.filter((payment) => payment.status === "Pending").length,
    confirmedPayments: paymentRows.filter((payment) => payment.status === "Confirmed").length,
    openTickets: ticketRows.filter((ticket) => !["Resolved", "Closed"].includes(ticket.status)).length,
    platformAdmins: platformAdminRows.filter((adminRow) => adminRow.status === "Active").length,
    revenueKes: paymentRows
      .filter((payment) => payment.status === "Confirmed")
      .reduce((sum, payment) => sum + Number(payment.amount_kes ?? 0), 0),
  };

  return {
    summary,
    workspaces,
    applications: applicationRows,
    payments: paymentRows,
    subscriptions: subscriptionRows,
    tickets: ticketRows,
    platformAdmins: platformAdminRows,
  };
}

export async function GET(request: Request) {
  const auth = await requireSession(request, { platformAdmin: true });
  if (auth.response) return auth.response;

  const snapshot = await loadSaasSnapshot();
  return NextResponse.json(snapshot);
}

export async function PATCH(request: Request) {
  const auth = await requireSession(request, { platformAdmin: true });
  if (auth.response) return auth.response;

  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Admin action is invalid." }, { status: 400 });
  }

  const input = parsed.data;
  const admin = getLooseSupabaseAdmin();
  const now = new Date().toISOString();
  let tenantId = input.tenantId ?? "";
  let candidateId = input.candidateId ?? "";
  let recordId = input.applicationId ?? input.paymentId ?? input.subscriptionId ?? input.ticketId ?? input.candidateId ?? null;

  if (input.applicationId) {
    const { data } = await admin.from("candidate_onboarding_applications").select("tenant_id, candidate_id").eq("id", input.applicationId).maybeSingle();
    const application = row<Pick<ApplicationRow, "tenant_id" | "candidate_id">>(data);
    tenantId = tenantId || application?.tenant_id || "";
    candidateId = candidateId || application?.candidate_id || "";
  }

  if (input.paymentId) {
    const { data } = await admin.from("workspace_activation_payments").select("tenant_id, candidate_id, onboarding_application_id").eq("id", input.paymentId).maybeSingle();
    const payment = row<Pick<PaymentRow, "tenant_id" | "candidate_id" | "onboarding_application_id">>(data);
    tenantId = tenantId || payment?.tenant_id || "";
    candidateId = candidateId || payment?.candidate_id || "";
    if (!input.applicationId && payment?.onboarding_application_id) recordId = payment.onboarding_application_id;
  }

  if (!tenantId || !candidateId) {
    return NextResponse.json({ error: "Admin action needs a workspace candidate or application." }, { status: 400 });
  }

  if (input.action === "Approve Workspace") {
    if (input.applicationId) {
      await admin.from("candidate_onboarding_applications").update({ status: "Activated", activated_at: now }).eq("id", input.applicationId);
    }
    await admin.from("candidates").update({ active_status: "Active", verification_status: "Verified" }).eq("id", candidateId);
    await admin.from("campaign_settings").update({ active_status: "Active" }).eq("candidate_id", candidateId);
    await admin.from("campaign_members").update({ status: "Active" }).eq("candidate_id", candidateId);
    await admin.from("workspace_subscriptions").update({ status: "Active" }).eq("candidate_id", candidateId);
  }

  if (input.action === "Confirm Payment") {
    if (!input.paymentId) return NextResponse.json({ error: "Payment ID is required." }, { status: 400 });
    await admin.from("workspace_activation_payments").update({ status: "Confirmed", confirmed_at: now }).eq("id", input.paymentId);
    if (input.applicationId) await admin.from("candidate_onboarding_applications").update({ status: "Activated", activated_at: now }).eq("id", input.applicationId);
    await admin.from("candidates").update({ active_status: "Active", verification_status: "Verified" }).eq("id", candidateId);
    await admin.from("workspace_subscriptions").update({ status: "Active" }).eq("candidate_id", candidateId);
  }

  if (input.action === "Suspend Workspace") {
    await admin.from("candidates").update({ active_status: "Suspended" }).eq("id", candidateId);
    await admin.from("campaign_settings").update({ active_status: "Suspended" }).eq("candidate_id", candidateId);
    await admin.from("workspace_subscriptions").update({ status: "Past Due" }).eq("candidate_id", candidateId);
  }

  if (input.action === "Reactivate Workspace") {
    await admin.from("candidates").update({ active_status: "Active" }).eq("id", candidateId);
    await admin.from("campaign_settings").update({ active_status: "Active" }).eq("candidate_id", candidateId);
    await admin.from("workspace_subscriptions").update({ status: "Active" }).eq("candidate_id", candidateId);
  }

  if (input.action === "Cancel Subscription") {
    await admin.from("workspace_subscriptions").update({ status: "Cancelled" }).eq("candidate_id", candidateId);
  }

  if (input.action === "Mark Past Due") {
    await admin.from("workspace_subscriptions").update({ status: "Past Due" }).eq("candidate_id", candidateId);
  }

  if (input.action === "Resolve Ticket" || input.action === "Close Ticket") {
    if (!input.ticketId) return NextResponse.json({ error: "Ticket ID is required." }, { status: 400 });
    await admin
      .from("support_tickets")
      .update({ status: input.action === "Resolve Ticket" ? "Resolved" : "Closed", updated_at: now })
      .eq("id", input.ticketId);
  }

  await writeAudit({
    tenantId,
    candidateId,
    action: "Update",
    module: "SaaS Admin",
    recordId,
    newValue: input,
  });

  const snapshot = await loadSaasSnapshot();
  return NextResponse.json({ status: "Updated", action: input.action, ...snapshot });
}
