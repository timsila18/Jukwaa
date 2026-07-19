import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getLooseSupabaseAdmin } from "@/lib/supabase";
import { attachSessionCookies, attachWorkspaceSessionCookie, loginEmail } from "@/lib/auth-session";
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
  const member = chooseLoginMember(members as LoginMember[] | null, data.user?.id);
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
