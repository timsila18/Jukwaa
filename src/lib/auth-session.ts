import { NextResponse } from "next/server";
import { getLooseSupabaseAdmin, getSupabaseAdmin } from "@/lib/supabase";

export const accessCookie = "jukwaa_access_token";
export const refreshCookie = "jukwaa_refresh_token";

export type WorkspaceRole =
  | "Candidate"
  | "Campaign Manager"
  | "Constituency Coordinator"
  | "Ward Coordinator"
  | "Village Coordinator"
  | "Volunteer"
  | "Polling Agent"
  | "Media Team"
  | "Data Clerk"
  | "Admin";

export type SessionContext = {
  userId: string;
  email: string | null;
  tenantId: string;
  candidateId: string;
  memberId: string;
  role: WorkspaceRole;
  isPlatformAdmin: boolean;
};

export type WorkspaceAccess = {
  allowed: boolean;
  status: "Active" | "Payment Required" | "Admin Approved" | "Payment Confirmed";
  reason: string;
  subscriptionStatus?: string | null;
  onboardingStatus?: string | null;
  paymentStatus?: string | null;
};

function parseCookie(header: string | null, name: string) {
  return header
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function loginEmail(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.includes("@")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  return `${digits}@phone.jukwaa.local`;
}

export function attachSessionCookies(response: NextResponse, session: { access_token: string; refresh_token: string; expires_in?: number }) {
  const maxAge = session.expires_in ?? 60 * 60 * 24 * 7;
  response.cookies.set(accessCookie, session.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  response.cookies.set(refreshCookie, session.refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(accessCookie, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set(refreshCookie, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getSessionContext(request: Request): Promise<SessionContext | null> {
  const token = parseCookie(request.headers.get("cookie"), accessCookie);
  if (!token) return null;

  const auth = getSupabaseAdmin();
  const { data, error } = await auth.auth.getUser(token);
  if (error || !data.user) return null;

  const admin = getLooseSupabaseAdmin();
  const { data: member } = await admin
    .from("campaign_members")
    .select("id, tenant_id, candidate_id, role, email, status")
    .eq("user_id", data.user.id)
    .maybeSingle();

  const { data: platformAdmin } = await admin
    .from("platform_admins")
    .select("id")
    .eq("user_id", data.user.id)
    .eq("status", "Active")
    .maybeSingle();

  if (!member && !platformAdmin) return null;
  if (member && member.status !== "Active" && !platformAdmin) return null;

  return {
    userId: data.user.id,
    email: data.user.email ?? member?.email ?? null,
    tenantId: member?.tenant_id ?? "",
    candidateId: member?.candidate_id ?? "",
    memberId: member?.id ?? "",
    role: (member?.role ?? "Admin") as WorkspaceRole,
    isPlatformAdmin: Boolean(platformAdmin),
  };
}

export async function requireSession(request: Request, options?: { roles?: WorkspaceRole[]; platformAdmin?: boolean }) {
  const session = await getSessionContext(request);
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Login required." }, { status: 401 }) };
  }

  if (options?.platformAdmin && !session.isPlatformAdmin) {
    return { session: null, response: NextResponse.json({ error: "Platform administrator access required." }, { status: 403 }) };
  }

  if (options?.roles && !options.roles.includes(session.role) && !session.isPlatformAdmin) {
    return { session: null, response: NextResponse.json({ error: "You do not have permission for this action." }, { status: 403 }) };
  }

  return { session, response: null };
}

export async function getWorkspaceAccess(session: SessionContext): Promise<WorkspaceAccess> {
  if (session.isPlatformAdmin) {
    return { allowed: true, status: "Admin Approved", reason: "Platform administrator access." };
  }

  const admin = getLooseSupabaseAdmin();
  const [{ data: subscription }, { data: application }, { data: payment }] = await Promise.all([
    admin
      .from("workspace_subscriptions")
      .select("status")
      .eq("tenant_id", session.tenantId)
      .eq("candidate_id", session.candidateId)
      .limit(1)
      .maybeSingle(),
    admin
      .from("candidate_onboarding_applications")
      .select("status")
      .eq("tenant_id", session.tenantId)
      .eq("candidate_id", session.candidateId)
      .limit(1)
      .maybeSingle(),
    admin
      .from("workspace_activation_payments")
      .select("status")
      .eq("tenant_id", session.tenantId)
      .eq("candidate_id", session.candidateId)
      .eq("status", "Confirmed")
      .limit(1)
      .maybeSingle(),
  ]);

  const subscriptionStatus = subscription?.status ?? null;
  const onboardingStatus = application?.status ?? null;
  const paymentStatus = payment?.status ?? null;

  if (subscriptionStatus === "Active") {
    return { allowed: true, status: "Active", reason: "Workspace subscription is active.", subscriptionStatus, onboardingStatus, paymentStatus };
  }

  if (onboardingStatus === "Activated") {
    return { allowed: true, status: "Admin Approved", reason: "Workspace has been approved by an administrator.", subscriptionStatus, onboardingStatus, paymentStatus };
  }

  if (paymentStatus === "Confirmed") {
    return { allowed: true, status: "Payment Confirmed", reason: "Workspace payment has been confirmed.", subscriptionStatus, onboardingStatus, paymentStatus };
  }

  return {
    allowed: false,
    status: "Payment Required",
    reason: "Login is active, but workspace functions are locked until payment is confirmed or an administrator approves access.",
    subscriptionStatus,
    onboardingStatus,
    paymentStatus,
  };
}

export async function requireWorkspaceAccess(session: SessionContext) {
  const access = await getWorkspaceAccess(session);
  if (access.allowed) return { access, response: null };

  return {
    access,
    response: NextResponse.json(
      {
        error: "Payment or admin approval required before using this workspace function.",
        workspaceAccess: access,
      },
      { status: 402 },
    ),
  };
}
