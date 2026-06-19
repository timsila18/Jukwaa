import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getLooseSupabaseAdmin } from "@/lib/supabase";
import { enforceRateLimit, requestKey } from "@/lib/rate-limit";
import { loginEmail } from "@/lib/auth-session";

const schema = z.object({ login: z.string().trim().min(3) });

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(requestKey(request, "forgot-password"), 6, 60_000);
  if (!limited.allowed) return NextResponse.json({ error: "Too many reset requests. Try again shortly." }, { status: 429 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Phone or email is required." }, { status: 400 });

  const email = loginEmail(parsed.data.login);
  const admin = getLooseSupabaseAdmin();
  const { data: member } = await admin
    .from("campaign_members")
    .select("id, tenant_id, candidate_id, email, status")
    .eq("email", email)
    .maybeSingle();

  const genericResponse = NextResponse.json({
    status: "If the account exists, a reset request has been recorded.",
    note: "Ask your campaign administrator or JUKWAA support to issue the reset code.",
  });

  if (!member || member.status !== "Active") {
    return genericResponse;
  }

  const resetCode = `RST-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  await admin.from("password_reset_codes").insert({
    tenant_id: member.tenant_id,
    candidate_id: member.candidate_id,
    member_id: member.id,
    login_identifier: email,
    reset_code_hash: hashCode(resetCode),
    expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
  });

  return genericResponse;
}
