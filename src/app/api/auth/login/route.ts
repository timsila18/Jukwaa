import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getLooseSupabaseAdmin } from "@/lib/supabase";
import { attachSessionCookies, loginEmail } from "@/lib/auth-session";
import { enforceRateLimit, requestKey } from "@/lib/rate-limit";

const schema = z.object({
  login: z.string().trim().min(3),
  password: z.string().min(6),
});

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
  const { data: member } = await admin.from("campaign_members").select("tenant_id, candidate_id, id").eq("email", email).maybeSingle();
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

  const response = NextResponse.json({ user: data.user, workspace: member, redirectTo: "/" });
  if (data.session) attachSessionCookies(response, data.session);
  return response;
}
