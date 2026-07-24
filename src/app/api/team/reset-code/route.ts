import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth-session";
import { writeAudit } from "@/lib/server-workflows";
import { getLooseSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  memberId: z.string().uuid(),
});

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

export async function POST(request: Request) {
  const auth = await requireSession(request, { roles: ["Candidate", "Campaign Manager", "Admin"] });
  if (auth.response) return auth.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid team member." }, { status: 400 });
  }

  const admin = getLooseSupabaseAdmin();
  const { data: member, error } = await admin
    .from("campaign_members")
    .select("id, tenant_id, candidate_id, email, full_name, role, status")
    .eq("id", parsed.data.memberId)
    .eq("tenant_id", auth.session.tenantId)
    .eq("candidate_id", auth.session.candidateId)
    .maybeSingle();

  if (error || !member) {
    return NextResponse.json({ error: "Team member was not found in this workspace." }, { status: 404 });
  }

  if (member.status !== "Active") {
    return NextResponse.json({ error: "Only active team members can receive reset codes." }, { status: 409 });
  }

  if (!member.email) {
    return NextResponse.json({ error: "This team member does not have a login identifier yet." }, { status: 409 });
  }

  const resetCode = `RST-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();

  const { error: insertError } = await admin.from("password_reset_codes").insert({
    tenant_id: member.tenant_id,
    candidate_id: member.candidate_id,
    member_id: member.id,
    login_identifier: String(member.email).trim().toLowerCase(),
    reset_code_hash: hashCode(resetCode),
    expires_at: expiresAt,
    status: "Pending",
  });

  if (insertError) {
    return NextResponse.json({ error: "Reset code could not be created." }, { status: 500 });
  }

  await writeAudit({
    tenantId: auth.session.tenantId,
    candidateId: auth.session.candidateId,
    action: "Create",
    module: "Password Reset Code",
    recordId: member.id,
    newValue: {
      memberName: member.full_name,
      role: member.role,
      expiresAt,
    },
  });

  return NextResponse.json({
    resetCode,
    expiresAt,
    member: {
      id: member.id,
      fullName: member.full_name,
      email: member.email,
      role: member.role,
    },
  });
}
