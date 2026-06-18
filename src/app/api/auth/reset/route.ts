import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getLooseSupabaseAdmin, getSupabaseAdmin } from "@/lib/supabase";
import { enforceRateLimit, requestKey } from "@/lib/rate-limit";
import { loginEmail } from "@/lib/auth-session";

const schema = z.object({
  login: z.string().trim().min(3),
  resetCode: z.string().trim().min(6),
  password: z.string().min(8),
});

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(requestKey(request, "reset-password"), 10, 60_000);
  if (!limited.allowed) return NextResponse.json({ error: "Too many reset attempts. Try again shortly." }, { status: 429 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Phone/email, reset code, and new password are required." }, { status: 400 });

  const email = loginEmail(parsed.data.login);
  const admin = getLooseSupabaseAdmin();
  const { data: member } = await admin
    .from("campaign_members")
    .select("id, user_id, tenant_id, candidate_id, status")
    .eq("email", email)
    .maybeSingle();

  if (!member?.user_id || member.status !== "Active") {
    return NextResponse.json({ error: "No active JUKWAA account was found for those details." }, { status: 404 });
  }

  const { data: reset } = await admin
    .from("password_reset_codes")
    .select("id, expires_at, status")
    .eq("member_id", member.id)
    .eq("login_identifier", email)
    .eq("reset_code_hash", hashCode(parsed.data.resetCode))
    .eq("status", "Pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!reset || new Date(reset.expires_at).getTime() < Date.now()) {
    if (reset) await admin.from("password_reset_codes").update({ status: "Expired" }).eq("id", reset.id);
    return NextResponse.json({ error: "Reset code is invalid or expired." }, { status: 410 });
  }

  const authAdmin = getSupabaseAdmin();
  const { error } = await authAdmin.auth.admin.updateUserById(member.user_id, { password: parsed.data.password });
  if (error) return NextResponse.json({ error: "Could not update password.", detail: error.message }, { status: 409 });

  await admin.from("password_reset_codes").update({ status: "Used", used_at: new Date().toISOString() }).eq("id", reset.id);
  await admin.from("login_history").insert({
    tenant_id: member.tenant_id,
    candidate_id: member.candidate_id,
    member_id: member.id,
    event_type: "Password Updated",
    email,
    device_name: "Web",
    success: true,
  });

  return NextResponse.json({ status: "Password updated" });
}
