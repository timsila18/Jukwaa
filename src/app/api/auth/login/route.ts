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
  phone_number?: string | null;
  full_name?: string | null;
};

type LoginCandidate = {
  id: string;
  tenant_id: string;
  full_name: string;
  email?: string | null;
  phone_number?: string | null;
};

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
  userId: string;
  userMetadata: Record<string, unknown>;
  appMetadata: Record<string, unknown>;
}) {
  const { admin, email, userId, userMetadata, appMetadata } = input;
  const metadataTenantId = cleanString(appMetadata.tenant_id);
  const metadataCandidateId = cleanString(appMetadata.candidate_id);
  const metadataRole = workspaceRole(appMetadata.role);

  if (metadataTenantId && metadataCandidateId) {
    const { data: existing } = await admin
      .from("campaign_members")
      .select("tenant_id, candidate_id, id, status, user_id, role, email, phone_number, full_name")
      .eq("tenant_id", metadataTenantId)
      .eq("candidate_id", metadataCandidateId)
      .or(`email.eq.${email},user_id.eq.${userId}`)
      .limit(10);
    const existingMember = chooseLoginMember(existing as LoginMember[] | null, userId);
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
        phone_number: cleanString(userMetadata.phone_number) || null,
        role: metadataRole,
        status: "Active",
      })
      .select("tenant_id, candidate_id, id, status, user_id, role, email, phone_number, full_name")
      .single();
    return inserted as LoginMember | null;
  }

  const { data: candidates } = await admin
    .from("candidates")
    .select("id, tenant_id, full_name, email, phone_number")
    .eq("email", email)
    .limit(10);
  const candidate = Array.isArray(candidates) ? candidates[0] as LoginCandidate | undefined : candidates as LoginCandidate | null;
  if (!candidate?.id || !candidate.tenant_id) return null;

  const { data: existingCandidateMembers } = await admin
    .from("campaign_members")
    .select("tenant_id, candidate_id, id, status, user_id, role, email, phone_number, full_name")
    .eq("tenant_id", candidate.tenant_id)
    .eq("candidate_id", candidate.id)
    .or(`email.eq.${email},user_id.eq.${userId}`)
    .limit(10);
  const existingCandidateMember = chooseLoginMember(existingCandidateMembers as LoginMember[] | null, userId);
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
      phone_number: candidate.phone_number || cleanString(userMetadata.phone_number) || null,
      role: "Candidate",
      status: "Active",
    })
    .select("tenant_id, candidate_id, id, status, user_id, role, email, phone_number, full_name")
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
  const { data: members } = await admin
    .from("campaign_members")
    .select("tenant_id, candidate_id, id, status, user_id, role, email, phone_number, full_name")
    .or(`email.eq.${email},user_id.eq.${data.user?.id ?? "00000000-0000-0000-0000-000000000000"}`)
    .limit(10);
  let member: LoginMember | null = chooseLoginMember(members as LoginMember[] | null, data.user?.id);
  if (member) {
    await admin.from("login_history").insert({
      tenant_id: member.tenant_id,
      candidate_id: member.candidate_id,
      member_id: member.id,
      event_type: error ? "Failed Login" : "Login",
      email,
      device_name: "Web",
      success: !error,
    });
  }

  if (error) {
    return NextResponse.json({ error: "Invalid login credentials." }, { status: 401 });
  }

  if (!data.session) {
    return NextResponse.json({ error: "Login could not start a session. Try again." }, { status: 503 });
  }

  if (!member) {
    member = await restoreLoginMember({
      admin,
      email,
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
      .or(`email.eq.${email},user_id.eq.${data.user.id}`)
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

  const response = NextResponse.json({ user: data.user, workspace: member, redirectTo: "/" });
  attachSessionCookies(response, data.session);
  attachWorkspaceSessionCookie(response, {
    userId: data.user.id,
    email: member.email ?? email,
    fullName: member.full_name ?? String(data.user.user_metadata?.full_name ?? ""),
    phone: member.phone_number ?? null,
    tenantId: member.tenant_id,
    candidateId: member.candidate_id,
    memberId: member.id,
    role: String(member.role ?? "Candidate") as Parameters<typeof attachWorkspaceSessionCookie>[1]["role"],
    isPlatformAdmin: false,
  });
  return response;
}
