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

  if (invitation.status !== "Pending") {
    return NextResponse.json({ error: "That joining code has already been used or revoked." }, { status: 409 });
  }

  if (new Date(`${invitation.expiry_date}T23:59:59`) < new Date()) {
    await admin.from("invitations").update({ status: "Expired" }).eq("id", invitation.id);
    return NextResponse.json({ error: "That joining code has expired. Ask your campaign admin for a new one." }, { status: 410 });
  }

  if (!loginMatchesInvitation(input.login, invitation)) {
    return NextResponse.json({ error: "Phone or email does not match the invitation." }, { status: 403 });
  }

  const email = loginEmail(input.login);
  const created = await authAdmin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    phone_confirm: true,
    user_metadata: {
      full_name: invitation.invited_name,
      jukwaa_join_code: code,
    },
    app_metadata: {
      tenant_id: invitation.tenant_id,
      candidate_id: invitation.candidate_id,
      role: invitation.role,
    },
  });

  if (created.error || !created.data.user) {
    return NextResponse.json(
      { error: "Could not create login. If this phone/email already joined, use login or reset password.", detail: created.error?.message },
      { status: 409 },
    );
  }

  const { data: existingMember } = await admin
    .from("campaign_members")
    .select("id")
    .eq("tenant_id", invitation.tenant_id)
    .eq("email", email)
    .maybeSingle();

  let memberId = String(existingMember?.id ?? "");
  if (existingMember) {
    await admin
      .from("campaign_members")
      .update({ user_id: created.data.user.id, full_name: invitation.invited_name, role: invitation.role, status: "Active", candidate_id: invitation.candidate_id })
      .eq("id", existingMember.id);
  } else {
    const { data: newMember } = await admin.from("campaign_members").insert({
      tenant_id: invitation.tenant_id,
      candidate_id: invitation.candidate_id,
      user_id: created.data.user.id,
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
    userId: created.data.user.id,
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
    userId: created.data.user.id,
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
