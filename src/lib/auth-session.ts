import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { getLooseSupabaseAdmin, getSupabaseAdmin } from "@/lib/supabase";

export const accessCookie = "jukwaa_access_token";
export const refreshCookie = "jukwaa_refresh_token";
export const workspaceSessionCookie = "jukwaa_workspace_session";

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
  fullName?: string | null;
  phone?: string | null;
  refreshedAuthSession?: { access_token: string; refresh_token: string; expires_in?: number } | null;
  tenantId: string;
  candidateId: string;
  memberId: string;
  role: WorkspaceRole;
  isPlatformAdmin: boolean;
};

export type WorkspaceSessionPayload = {
  userId: string;
  email: string | null;
  fullName?: string | null;
  phone?: string | null;
  tenantId: string;
  candidateId: string;
  memberId: string;
  role: WorkspaceRole;
  isPlatformAdmin?: boolean;
  exp: number;
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

function chooseWorkspaceMember<T extends { status?: string | null; user_id?: string | null }>(rows: T[] | null | undefined, userId?: string) {
  const members = Array.isArray(rows) ? rows : [];
  return (
    members.find((member) => userId && member.user_id === userId && member.status === "Active")
    ?? members.find((member) => member.status === "Active")
    ?? members.find((member) => userId && member.user_id === userId)
    ?? members[0]
    ?? null
  );
}

function rowsArray<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function isBlockedMemberStatus(status?: string | null) {
  return ["suspended", "revoked", "inactive", "deactivated", "expired"].includes(String(status ?? "").toLowerCase());
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sessionSecret() {
  return process.env.JUKWAA_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "jukwaa-local-session-secret";
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function verifySignedPayload(value?: string | null): WorkspaceSessionPayload | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = signPayload(payload);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) return null;
  const parsed = JSON.parse(base64UrlDecode(payload)) as WorkspaceSessionPayload;
  if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
  return parsed;
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

export function attachWorkspaceSessionCookie(response: NextResponse, session: Omit<WorkspaceSessionPayload, "exp">, maxAge = 60 * 60 * 24 * 7) {
  const payload = base64UrlEncode(JSON.stringify({ ...session, exp: Math.floor(Date.now() / 1000) + maxAge }));
  response.cookies.set(workspaceSessionCookie, `${payload}.${signPayload(payload)}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(accessCookie, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set(refreshCookie, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set(workspaceSessionCookie, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
}

async function getSignedWorkspaceSessionContext(request: Request): Promise<SessionContext | null> {
  const signed = verifySignedPayload(parseCookie(request.headers.get("cookie"), workspaceSessionCookie));
  if (!signed) return null;
  if (signed.isPlatformAdmin) {
    return {
      userId: signed.userId,
      email: signed.email,
      fullName: signed.fullName ?? null,
      phone: signed.phone ?? null,
      tenantId: signed.tenantId,
      candidateId: signed.candidateId,
      memberId: signed.memberId,
      role: signed.role,
      isPlatformAdmin: true,
    };
  }

  const admin = getLooseSupabaseAdmin();
  const { data: member } = await admin
    .from("campaign_members")
    .select("id, tenant_id, candidate_id, role, email, full_name, status, user_id")
    .eq("id", signed.memberId)
    .limit(1)
    .maybeSingle();

  const row = member as {
    id?: string;
    tenant_id?: string;
    candidate_id?: string;
    role?: string;
    email?: string | null;
    full_name?: string | null;
    status?: string | null;
    user_id?: string | null;
  } | null;

  if (!row || isBlockedMemberStatus(row.status)) return null;
  return {
    userId: row.user_id || signed.userId,
    email: row.email ?? signed.email,
    fullName: row.full_name ?? signed.fullName ?? null,
    phone: signed.phone ?? null,
    tenantId: String(row.tenant_id ?? signed.tenantId),
    candidateId: String(row.candidate_id ?? signed.candidateId),
    memberId: String(row.id ?? signed.memberId),
    role: String(row.role ?? signed.role) as WorkspaceRole,
    isPlatformAdmin: false,
  };
}

export async function getSessionContext(request: Request): Promise<SessionContext | null> {
  let token = parseCookie(request.headers.get("cookie"), accessCookie);
  const refreshToken = parseCookie(request.headers.get("cookie"), refreshCookie);
  if (!token && !refreshToken) return getSignedWorkspaceSessionContext(request);

  const auth = getSupabaseAdmin();
  let refreshedAuthSession: SessionContext["refreshedAuthSession"] = null;
  let { data, error } = token
    ? await auth.auth.getUser(token)
    : { data: { user: null }, error: new Error("Access token missing") };
  if (error || !data.user) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (url && key && refreshToken) {
      const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
      const refreshed = await client.auth.refreshSession({ refresh_token: refreshToken });
      if (refreshed.data.session?.access_token) {
        refreshedAuthSession = refreshed.data.session;
        token = refreshed.data.session.access_token;
        const retry = await auth.auth.getUser(token);
        data = retry.data;
        error = retry.error;
      }
    }
  }
  if (error || !data.user) return getSignedWorkspaceSessionContext(request);

  const admin = getLooseSupabaseAdmin();
  const { data: primaryMembers } = await admin
    .from("campaign_members")
    .select("id, tenant_id, candidate_id, role, email, full_name, status, user_id")
    .eq("user_id", data.user.id)
    .limit(10);

  const appMetadata = data.user.app_metadata as Record<string, unknown>;
  const userMetadata = data.user.user_metadata as Record<string, unknown>;
  let member = chooseWorkspaceMember(rowsArray(primaryMembers), data.user.id);
  if (!member && data.user.email && appMetadata.tenant_id && appMetadata.candidate_id) {
    const { data: matchedMembers } = await admin
      .from("campaign_members")
      .select("id, tenant_id, candidate_id, role, email, full_name, status, user_id")
      .eq("tenant_id", String(appMetadata.tenant_id))
      .eq("candidate_id", String(appMetadata.candidate_id))
      .eq("email", data.user.email)
      .limit(10);
    const matchedMember = chooseWorkspaceMember(rowsArray(matchedMembers), data.user.id);
    member = matchedMember;
    if (matchedMember) {
      await admin.from("campaign_members").update({ user_id: data.user.id }).eq("id", matchedMember.id);
    }
  }

  if (!member && appMetadata.tenant_id && appMetadata.candidate_id) {
    const tenantId = String(appMetadata.tenant_id);
    const candidateId = String(appMetadata.candidate_id);
    const role = (cleanString(appMetadata.role) || "Candidate") as WorkspaceRole;
    const fullName = cleanString(userMetadata.full_name) || cleanString(data.user.email) || "JUKWAA User";
    const email = data.user.email ?? `${data.user.id}@user.jukwaa.local`;

    const { data: createdMember } = await admin
      .from("campaign_members")
      .insert({
        tenant_id: tenantId,
        candidate_id: candidateId,
        user_id: data.user.id,
        email,
        full_name: fullName,
        role,
        status: "Active",
      })
      .select("id, tenant_id, candidate_id, role, email, full_name, status, user_id")
      .single();

    member = chooseWorkspaceMember(rowsArray(createdMember as typeof member), data.user.id);
  }

  const { data: platformAdmin } = await admin
    .from("platform_admins")
    .select("id")
    .eq("user_id", data.user.id)
    .eq("status", "Active")
    .maybeSingle();

  if (!member && !platformAdmin) return null;
  if (member && isBlockedMemberStatus(String(member.status ?? "")) && !platformAdmin) return null;

  return {
    userId: data.user.id,
    email: data.user.email ?? (String(member?.email ?? "") || null),
    fullName: String(member?.full_name ?? userMetadata.full_name ?? "").trim() || null,
    phone: String(data.user.phone ?? userMetadata.phone_number ?? "").trim() || null,
    refreshedAuthSession,
    tenantId: String(member?.tenant_id ?? ""),
    candidateId: String(member?.candidate_id ?? ""),
    memberId: String(member?.id ?? ""),
    role: String(member?.role ?? "Admin") as WorkspaceRole,
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
