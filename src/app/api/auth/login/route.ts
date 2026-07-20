import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getLooseSupabaseAdmin } from "@/lib/supabase";
import { attachSessionCookies, attachWorkspaceSessionCookie, loginEmail, type WorkspaceRole } from "@/lib/auth-session";
import { enforceRateLimit, requestKey } from "@/lib/rate-limit";

const schema = z.object({
  login: z.string().trim().min(3),
  password: z.string().min(6),
});

type LoginMember = {
  id: string;
  tenant_id: string;
  candidate_id: string;
  status?: string | null;
  user_id?: string | null;
  role?: string | null;
  email?: string | null;
  full_name?: string | null;
};

type LoginCandidate = {
  id: string;
  tenant_id: string;
  full_name: string;
  email?: string | null;
  phone_number?: string | null;
};

const MEMBER_SELECT = "tenant_id, candidate_id, id, status, user_id, role, email, full_name";
const EMPTY_USER_ID = "00000000-0000-0000-0000-000000000000";

function chooseLoginMember(rows: LoginMember[] | null | undefined, userId?: string) {
  const members = Array.isArray(rows) ? rows : [];
  return (
    members.find((member) => userId && member.user_id === userId && member.status === "Active")
    ?? members.find((member) => member.status === "Active")
    ?? members.find((member) => userId && member.user_id === userId)
    ?? members[0]
    ?? null
  );
}

function isBlockedMemberStatus(status?: string | null) {
  return ["suspended", "revoked", "inactive", "deactivated", "expired"].includes(String(status ?? "").toLowerCase());
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: unknown) {
  const text = cleanString(value).toLowerCase();
  return text && text.includes("@") ? text : "";
}

function phoneDigits(value: unknown) {
  return cleanString(value).replace(/\D/g, "");
}

function phoneAlias(value: unknown) {
  const digits = phoneDigits(value);
  return digits.length >= 7 ? `${digits}@phone.jukwaa.local` : "";
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => cleanString(value).toLowerCase()).filter(Boolean)));
}

function loginIdentifiers(input: {
  login: string;
  authEmail: string;
  userEmail?: string | null;
  userPhone?: string | null;
  userMetadata?: Record<string, unknown>;
}) {
  const metadata = input.userMetadata ?? {};
  const emails = unique([
    input.authEmail,
    input.userEmail,
    normalizeEmail(metadata.email),
    normalizeEmail(metadata.invited_email),
    phoneAlias(input.login),
    phoneAlias(input.userPhone),
    phoneAlias(metadata.phone),
    phoneAlias(metadata.phone_number),
    phoneAlias(metadata.invited_phone),
  ]);
  const phones = unique([
    phoneDigits(input.login),
    phoneDigits(input.userPhone),
    phoneDigits(metadata.phone),
    phoneDigits(metadata.phone_number),
    phoneDigits(metadata.invited_phone),
  ]);
  return { emails, phones };
}

function mergeMembers(...sets: Array<LoginMember[] | null | undefined>) {
  const byId = new Map<string, LoginMember>();
  for (const rows of sets) {
    for (const row of Array.isArray(rows) ? rows : []) {
      if (row?.id) byId.set(row.id, row);
    }
  }
  return Array.from(byId.values());
}

async function findLoginMembers(input: {
  admin: ReturnType<typeof getLooseSupabaseAdmin>;
  emails: string[];
  userId?: string | null;
  tenantId?: string;
  candidateId?: string;
}) {
  const { admin, emails, userId, tenantId, candidateId } = input;
  let byUser: LoginMember[] | null = null;
  let byEmail: LoginMember[] | null = null;

  if (userId) {
    let query = admin.from("campaign_members").select(MEMBER_SELECT).eq("user_id", userId).limit(20);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    if (candidateId) query = query.eq("candidate_id", candidateId);
    const result = await query;
    byUser = result.data as LoginMember[] | null;
  }

  if (emails.length) {
    let query = admin.from("campaign_members").select(MEMBER_SELECT).in("email", emails).limit(20);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    if (candidateId) query = query.eq("candidate_id", candidateId);
    const result = await query;
    byEmail = result.data as LoginMember[] | null;
  }

  return mergeMembers(byUser, byEmail);
}

function workspaceRole(value: unknown): WorkspaceRole {
  const allowed: WorkspaceRole[] = [
    "Candidate",
    "Campaign Manager",
    "Constituency Coordinator",
    "Ward Coordinator",
    "Village Coordinator",
    "Volunteer",
    "Polling Agent",
    "Media Team",
    "Data Clerk",
    "Admin",
  ];
  return allowed.includes(value as WorkspaceRole) ? value as WorkspaceRole : "Candidate";
}

async function restoreLoginMember(input: {
  admin: ReturnType<typeof getLooseSupabaseAdmin>;
  email: string;
  emails: string[];
  phones: string[];
  userId: string;
  userMetadata: Record<string, unknown>;
  appMetadata: Record<string, unknown>;
}) {
  const { admin, email, emails, phones, userId, userMetadata, appMetadata } = input;
  const metadataTenantId = cleanString(appMetadata.tenant_id);
  const metadataCandidateId = cleanString(appMetadata.candidate_id);
  const metadataRole = workspaceRole(appMetadata.role);

  if (metadataTenantId && metadataCandidateId) {
    const existing = await findLoginMembers({ admin, emails, userId, tenantId: metadataTenantId, candidateId: metadataCandidateId });
    const existingMember = chooseLoginMember(existing, userId);
    if (existingMember) {
      await admin.from("campaign_members").update({ user_id: userId, status: "Active" }).eq("id", existingMember.id);
      return { ...existingMember, user_id: userId, status: "Active" } as LoginMember;
    }

    const { data: inserted } = await admin
      .from("campaign_members")
      .insert({
        tenant_id: metadataTenantId,
        candidate_id: metadataCandidateId,
        user_id: userId,
        email,
        full_name: cleanString(userMetadata.full_name) || email,
      role: metadataRole,
      status: "Active",
    })
      .select(MEMBER_SELECT)
      .single();
    return inserted as LoginMember | null;
  }

  const { data: candidates } = await admin
    .from("candidates")
    .select("id, tenant_id, full_name, email, phone_number")
    .in("email", emails.length ? emails : [email])
    .limit(10);

  let candidate = Array.isArray(candidates) ? candidates[0] as LoginCandidate | undefined : candidates as LoginCandidate | null;
  if (!candidate?.id && phones.length) {
    const { data: candidatePool } = await admin
      .from("candidates")
      .select("id, tenant_id, full_name, email, phone_number")
      .limit(1000);
    candidate = (Array.isArray(candidatePool) ? candidatePool : [])
      .find((row) => phones.includes(phoneDigits((row as LoginCandidate).phone_number))) as LoginCandidate | undefined;
  }
  if (!candidate?.id || !candidate.tenant_id) return null;

  const existingCandidateMembers = await findLoginMembers({
    admin,
    emails,
    userId,
    tenantId: candidate.tenant_id,
    candidateId: candidate.id,
  });
  const existingCandidateMember = chooseLoginMember(existingCandidateMembers, userId);
  if (existingCandidateMember) {
    await admin.from("campaign_members").update({ user_id: userId, status: "Active", role: "Candidate" }).eq("id", existingCandidateMember.id);
    return { ...existingCandidateMember, user_id: userId, status: "Active", role: "Candidate" } as LoginMember;
  }

  const { data: insertedCandidateMember } = await admin
    .from("campaign_members")
    .insert({
      tenant_id: candidate.tenant_id,
      candidate_id: candidate.id,
      user_id: userId,
      email,
      full_name: candidate.full_name || cleanString(userMetadata.full_name) || email,
      role: "Candidate",
      status: "Active",
    })
    .select(MEMBER_SELECT)
    .single();
  return insertedCandidateMember as LoginMember | null;
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(requestKey(request, "login"), 20, 60_000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many login attempts. Try again shortly." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Login and password are required." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "JUKWAA login is not configured yet." }, { status: 503 });
  }

  const email = loginEmail(parsed.data.login);
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });

  const admin = getLooseSupabaseAdmin();
  if (error) {
    const identifiers = loginIdentifiers({ login: parsed.data.login, authEmail: email });
    const failedMembers = await findLoginMembers({ admin, emails: identifiers.emails, userId: EMPTY_USER_ID });
    const failedMember = chooseLoginMember(failedMembers);
    if (failedMember) {
      await admin.from("login_history").insert({
        tenant_id: failedMember.tenant_id,
        candidate_id: failedMember.candidate_id,
        member_id: failedMember.id,
        event_type: "Failed Login",
        email,
        device_name: "Web",
        success: false,
      });
    }
    return NextResponse.json({ error: "Invalid login credentials." }, { status: 401 });
  }

  if (!data.session) {
    return NextResponse.json({ error: "Login could not start a session. Try again." }, { status: 503 });
  }

  const identifiers = loginIdentifiers({
    login: parsed.data.login,
    authEmail: email,
    userEmail: data.user.email,
    userPhone: data.user.phone,
    userMetadata: data.user.user_metadata as Record<string, unknown>,
  });
  let member: LoginMember | null = chooseLoginMember(
    await findLoginMembers({ admin, emails: identifiers.emails, userId: data.user.id }),
    data.user.id,
  );

  if (!member) {
    member = await restoreLoginMember({
      admin,
      email,
      emails: identifiers.emails,
      phones: identifiers.phones,
      userId: data.user.id,
      userMetadata: data.user.user_metadata as Record<string, unknown>,
      appMetadata: data.user.app_metadata as Record<string, unknown>,
    });
  }

  if (!member) {
    const { data: platformAdmin } = await admin
      .from("platform_admins")
      .select("id")
      .eq("status", "Active")
      .in("email", identifiers.emails.length ? identifiers.emails : [email])
      .maybeSingle();

    if (platformAdmin) {
      const response = NextResponse.json({ user: data.user, workspace: null, redirectTo: "/admin/saas" });
      attachSessionCookies(response, data.session);
      attachWorkspaceSessionCookie(response, {
        userId: data.user.id,
        email,
        fullName: String(data.user.user_metadata?.full_name ?? "Platform Admin"),
        phone: null,
        tenantId: "",
        candidateId: "",
        memberId: String(platformAdmin.id),
        role: "Admin",
        isPlatformAdmin: true,
      });
      return response;
    }

    return NextResponse.json({ error: "This login is not attached to an active campaign workspace yet." }, { status: 403 });
  }

  if (isBlockedMemberStatus(member.status)) {
    return NextResponse.json({ error: "This campaign account has been suspended or deactivated. Contact your campaign admin." }, { status: 403 });
  }

  if (data.user?.id && member.user_id !== data.user.id) {
    await admin.from("campaign_members").update({ user_id: data.user.id }).eq("id", member.id);
  }

  await admin.from("login_history").insert({
    tenant_id: member.tenant_id,
    candidate_id: member.candidate_id,
    member_id: member.id,
    event_type: "Login",
    email,
    device_name: "Web",
    success: true,
  });

  const response = NextResponse.json({ user: data.user, workspace: member, redirectTo: "/" });
  attachSessionCookies(response, data.session);
  attachWorkspaceSessionCookie(response, {
    userId: data.user.id,
    email: member.email ?? email,
    fullName: member.full_name ?? String(data.user.user_metadata?.full_name ?? ""),
    phone: data.user.phone ?? null,
    tenantId: member.tenant_id,
    candidateId: member.candidate_id,
    memberId: member.id,
    role: String(member.role ?? "Candidate") as Parameters<typeof attachWorkspaceSessionCookie>[1]["role"],
    isPlatformAdmin: false,
  });
  return response;
}
