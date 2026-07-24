import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getLooseSupabaseAdmin, getSupabaseAdmin } from "@/lib/supabase";
import { enforceRateLimit, requestKey } from "@/lib/rate-limit";
import { attachSessionCookies, attachWorkspaceSessionCookie, loginEmail, type WorkspaceRole } from "@/lib/auth-session";

const schema = z.object({
  login: z.string().trim().min(3),
  resetCode: z.string().trim().min(6),
  password: z.string().min(8),
});

type ResetInvitation = {
  id: string;
  tenant_id: string;
  candidate_id: string;
  invited_phone?: string | null;
  invited_email?: string | null;
  invitation_code?: string | null;
  status?: string | null;
  expiry_date?: string | null;
};

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

function phoneKey(value: string) {
  return value.replace(/\D/g, "");
}

function loginMatchesInvitation(login: string, invitation: { invited_email?: string | null; invited_phone?: string | null }) {
  const invitedEmail = invitation.invited_email?.toLowerCase();
  const invitedPhone = phoneKey(invitation.invited_phone ?? "");
  const normalizedLogin = login.trim().toLowerCase();

  if (invitedEmail && normalizedLogin === invitedEmail) return true;
  if (invitedPhone && phoneKey(normalizedLogin) === invitedPhone) return true;
  return false;
}

function workspaceRole(value: string | null | undefined): WorkspaceRole {
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

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim().toLowerCase()).filter(Boolean))) as string[];
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(requestKey(request, "reset-password"), 10, 60_000);
  if (!limited.allowed) return NextResponse.json({ error: "Too many reset attempts. Try again shortly." }, { status: 429 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Phone/email, reset code, and new password are required." }, { status: 400 });

  const email = loginEmail(parsed.data.login);
  const admin = getLooseSupabaseAdmin();
  let memberResult = await admin
    .from("campaign_members")
    .select("id, user_id, tenant_id, candidate_id, status, email, full_name, role")
    .eq("email", email)
    .maybeSingle();
  let member = memberResult.data;
  const resetCode = parsed.data.resetCode.trim().toUpperCase();
  let invitationForCode: ResetInvitation | null = null;

  if (!member) {
    const invitationResult = await admin
      .from("invitations")
      .select("id, tenant_id, candidate_id, invited_phone, invited_email, invitation_code, status, expiry_date")
      .eq("invitation_code", resetCode)
      .maybeSingle();
    invitationForCode = invitationResult.data as ResetInvitation | null;
    const invitationActive = invitationForCode
      && ["Pending", "Accepted"].includes(String(invitationForCode.status))
      && new Date(`${invitationForCode.expiry_date}T23:59:59`).getTime() >= Date.now()
      && loginMatchesInvitation(parsed.data.login, invitationForCode);

    if (invitationActive && invitationForCode) {
      const aliases = unique([
        email,
        invitationForCode.invited_email,
        invitationForCode.invited_phone ? loginEmail(invitationForCode.invited_phone) : null,
      ]);
      const byInvitation = await admin
        .from("campaign_members")
        .select("id, user_id, tenant_id, candidate_id, status, email, full_name, role")
        .eq("tenant_id", invitationForCode.tenant_id)
        .eq("candidate_id", invitationForCode.candidate_id)
        .in("email", aliases.length ? aliases : [email])
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      member = byInvitation.data;
    }
  }

  if (!member?.user_id || member.status !== "Active") {
    return NextResponse.json({ error: "No active JUKWAA account was found for those details." }, { status: 404 });
  }

  const { data: reset } = await admin
    .from("password_reset_codes")
    .select("id, expires_at, status")
    .eq("member_id", member.id)
    .eq("login_identifier", email)
      .eq("reset_code_hash", hashCode(resetCode))
    .eq("status", "Pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let resetId = reset?.id ?? "";
  let resetSource: "Reset Code" | "Joining Code" = "Reset Code";

  if (!reset || new Date(reset.expires_at).getTime() < Date.now()) {
    if (reset) await admin.from("password_reset_codes").update({ status: "Expired" }).eq("id", reset.id);
    if (!invitationForCode) {
      const { data: invitation } = await admin
        .from("invitations")
        .select("id, tenant_id, candidate_id, invited_phone, invited_email, invitation_code, status, expiry_date")
        .eq("invitation_code", resetCode)
        .maybeSingle();
      invitationForCode = invitation as ResetInvitation | null;
    }

    const invitationActive = invitationForCode
      && ["Pending", "Accepted"].includes(String(invitationForCode.status))
      && new Date(`${invitationForCode.expiry_date}T23:59:59`).getTime() >= Date.now()
      && invitationForCode.tenant_id === member.tenant_id
      && invitationForCode.candidate_id === member.candidate_id
      && loginMatchesInvitation(parsed.data.login, invitationForCode);

    if (!invitationActive) {
      return NextResponse.json({ error: "Reset code is invalid or expired." }, { status: 410 });
    }

    resetId = "";
    resetSource = "Joining Code";
  }

  const authAdmin = getSupabaseAdmin();
  const { error } = await authAdmin.auth.admin.updateUserById(member.user_id, { password: parsed.data.password });
  if (error) return NextResponse.json({ error: "Could not update password.", detail: error.message }, { status: 409 });

  if (resetId) await admin.from("password_reset_codes").update({ status: "Used", used_at: new Date().toISOString() }).eq("id", resetId);
  await admin.from("login_history").insert({
    tenant_id: member.tenant_id,
    candidate_id: member.candidate_id,
    member_id: member.id,
    event_type: `Password Updated (${resetSource})`,
    email,
    device_name: "Web",
    success: true,
  });

  const response = NextResponse.json({ status: "Password updated. Opening your dashboard...", redirectTo: "/" });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && key) {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const signedIn = await client.auth.signInWithPassword({ email, password: parsed.data.password });
    if (signedIn.data.session) attachSessionCookies(response, signedIn.data.session);
  }
  attachWorkspaceSessionCookie(response, {
    userId: member.user_id,
    email,
    fullName: member.full_name ?? null,
    phone: null,
    tenantId: member.tenant_id,
    candidateId: member.candidate_id,
    memberId: member.id,
    role: workspaceRole(member.role),
    isPlatformAdmin: false,
  });

  return response;
}
