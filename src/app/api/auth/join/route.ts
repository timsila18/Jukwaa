import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getLooseSupabaseAdmin, getSupabaseAdmin } from "@/lib/supabase";
import { enforceRateLimit, requestKey } from "@/lib/rate-limit";
import { writeAudit } from "@/lib/server-workflows";
import { attachSessionCookies, attachWorkspaceSessionCookie, type WorkspaceRole } from "@/lib/auth-session";

const schema = z.object({
  joinCode: z.string().trim().min(6),
  login: z.string().trim().min(3),
  password: z.string().min(8),
});

function phoneKey(value: string) {
  return value.replace(/\D/g, "");
}

function loginEmail(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.includes("@")) return trimmed;
  return `${phoneKey(trimmed)}@phone.jukwaa.local`;
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim().toLowerCase()).filter(Boolean))) as string[];
}

function loginMatchesInvitation(login: string, invitation: Record<string, string>) {
  const invitedEmail = invitation.invited_email?.toLowerCase();
  const invitedPhone = phoneKey(invitation.invited_phone ?? "");
  const normalizedLogin = login.trim().toLowerCase();

  if (invitedEmail && normalizedLogin === invitedEmail) return true;
  if (invitedPhone && phoneKey(normalizedLogin) === invitedPhone) return true;
  return false;
}

function workspaceRole(value: string): WorkspaceRole {
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
  return allowed.includes(value as WorkspaceRole) ? value as WorkspaceRole : "Volunteer";
}

type AuthAdmin = ReturnType<typeof getSupabaseAdmin>;

async function findAuthUserByEmail(authAdmin: AuthAdmin, email: string) {
  const normalized = email.toLowerCase();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await authAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return { user: null, error };
    const user = data.users.find((item) => item.email?.toLowerCase() === normalized) ?? null;
    if (user) return { user, error: null };
    if (data.users.length < 1000) break;
  }
  return { user: null, error: null };
}

async function createOrUpdateInvitedUser(input: {
  authAdmin: AuthAdmin;
  email: string;
  password: string;
  code: string;
  invitation: {
    invited_name: string | null;
    invited_phone: string | null;
    invited_email: string | null;
    tenant_id: string;
    candidate_id: string;
    role: string;
  };
}) {
  const { authAdmin, email, password, code, invitation } = input;
  const userMetadata = {
    full_name: invitation.invited_name,
    invited_email: invitation.invited_email,
    invited_phone: invitation.invited_phone,
    jukwaa_join_code: code,
  };
  const appMetadata = {
    tenant_id: invitation.tenant_id,
    candidate_id: invitation.candidate_id,
    role: invitation.role,
  };

  const created = await authAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    phone_confirm: true,
    user_metadata: userMetadata,
    app_metadata: appMetadata,
  });

  if (created.data.user) return { user: created.data.user, error: null };

  const message = created.error?.message?.toLowerCase() ?? "";
  if (!message.includes("already") && !message.includes("registered") && !message.includes("exists")) {
    return { user: null, error: created.error };
  }

  const found = await findAuthUserByEmail(authAdmin, email);
  if (found.error || !found.user) return { user: null, error: found.error ?? created.error };

  const updated = await authAdmin.auth.admin.updateUserById(found.user.id, {
    password,
    email_confirm: true,
    phone_confirm: true,
    user_metadata: { ...(found.user.user_metadata ?? {}), ...userMetadata },
    app_metadata: { ...(found.user.app_metadata ?? {}), ...appMetadata },
  });

  return { user: updated.data.user ?? found.user, error: updated.error };
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(requestKey(request, "join-code"), 10, 60_000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many join attempts. Try again shortly." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Join code, phone/email, and an 8 character password are required." }, { status: 400 });
  }

  const admin = getLooseSupabaseAdmin();
  const authAdmin = getSupabaseAdmin();
  const input = parsed.data;
  const code = input.joinCode.trim().toUpperCase();

  const { data: invitation, error: inviteError } = await admin
    .from("invitations")
    .select("id, tenant_id, candidate_id, invited_name, invited_phone, invited_email, role, invitation_code, status, expiry_date")
    .eq("invitation_code", code)
    .maybeSingle();

  if (inviteError || !invitation) {
    return NextResponse.json({ error: "That joining code was not found." }, { status: 404 });
  }

  if (!["Pending", "Accepted"].includes(String(invitation.status))) {
    return NextResponse.json({ error: "That joining code has been revoked or is no longer active." }, { status: 409 });
  }

  if (new Date(`${invitation.expiry_date}T23:59:59`) < new Date()) {
    await admin.from("invitations").update({ status: "Expired" }).eq("id", invitation.id);
    return NextResponse.json({ error: "That joining code has expired. Ask your campaign admin for a new one." }, { status: 410 });
  }

  if (!loginMatchesInvitation(input.login, invitation)) {
    return NextResponse.json({ error: "Phone or email does not match the invitation." }, { status: 403 });
  }

  const email = loginEmail(input.login);
  const memberEmailAliases = unique([
    email,
    invitation.invited_email,
    invitation.invited_phone ? loginEmail(invitation.invited_phone) : null,
  ]);
  const authUser = await createOrUpdateInvitedUser({
    authAdmin,
    email,
    password: input.password,
    code,
    invitation: {
      invited_name: invitation.invited_name ?? null,
      invited_phone: invitation.invited_phone ?? null,
      invited_email: invitation.invited_email ?? null,
      tenant_id: invitation.tenant_id,
      candidate_id: invitation.candidate_id,
      role: invitation.role,
    },
  });

  if (authUser.error || !authUser.user) {
    return NextResponse.json(
      { error: "Could not prepare this login. Ask your campaign admin to regenerate the joining code.", detail: authUser.error?.message },
      { status: 409 },
    );
  }

  const { data: existingMember } = await admin
    .from("campaign_members")
    .select("id")
    .eq("tenant_id", invitation.tenant_id)
    .eq("candidate_id", invitation.candidate_id)
    .in("email", memberEmailAliases.length ? memberEmailAliases : [email])
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let memberId = String(existingMember?.id ?? "");
  if (existingMember) {
    await admin
      .from("campaign_members")
      .update({ user_id: authUser.user.id, full_name: invitation.invited_name, role: invitation.role, status: "Active", candidate_id: invitation.candidate_id })
      .eq("id", existingMember.id);
  } else {
    const { data: newMember } = await admin.from("campaign_members").insert({
      tenant_id: invitation.tenant_id,
      candidate_id: invitation.candidate_id,
      user_id: authUser.user.id,
      email,
      full_name: invitation.invited_name,
      role: invitation.role,
      status: "Active",
    }).select("id").single();
    memberId = String(newMember?.id ?? "");
  }

  await admin.from("invitations").update({ status: "Accepted" }).eq("id", invitation.id);
  await admin.from("login_history").insert({
    tenant_id: invitation.tenant_id,
    candidate_id: invitation.candidate_id,
    event_type: "Password Updated",
    email,
    device_name: "Web",
    success: true,
  });

  await writeAudit({
    tenantId: invitation.tenant_id,
    candidateId: invitation.candidate_id,
    action: "Update",
    module: "Join Code Signup",
    recordId: invitation.id,
    newValue: { email, role: invitation.role, status: "Accepted" },
  });

  const response = NextResponse.json({
    status: "Joined",
    login: input.login,
    email,
    userId: authUser.user.id,
    redirectTo: "/",
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && key) {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const signedIn = await client.auth.signInWithPassword({ email, password: input.password });
    if (signedIn.data.session) attachSessionCookies(response, signedIn.data.session);
  }
  attachWorkspaceSessionCookie(response, {
    userId: authUser.user.id,
    email,
    fullName: invitation.invited_name,
    phone: invitation.invited_phone || null,
    tenantId: invitation.tenant_id,
    candidateId: invitation.candidate_id,
    memberId,
    role: workspaceRole(invitation.role),
    isPlatformAdmin: false,
  });

  return response;
}
