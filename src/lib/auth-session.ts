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

  if (!member) return null;
  if (member.status !== "Active") return null;

  return {
    userId: data.user.id,
    email: data.user.email ?? member.email ?? null,
    tenantId: member.tenant_id,
    candidateId: member.candidate_id,
    memberId: member.id,
    role: member.role as WorkspaceRole,
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
