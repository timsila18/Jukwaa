import { NextResponse } from "next/server";
import { z } from "zod";
import { getLooseSupabaseAdmin } from "@/lib/supabase";
import { requireSession } from "@/lib/auth-session";
import { shortCode, writeAudit } from "@/lib/server-workflows";

const patchSchema = z.object({
  invitationId: z.string().uuid(),
  action: z.enum(["Regenerate Code", "Revoke", "Expire"]),
});

export async function GET(request: Request) {
  const auth = await requireSession(request, { roles: ["Candidate", "Campaign Manager", "Admin", "Constituency Coordinator", "Ward Coordinator"] });
  if (auth.response) return auth.response;

  const admin = getLooseSupabaseAdmin();
  const { data, error } = await admin
    .from("invitations")
    .select("id, invited_name, invited_phone, invited_email, role, invitation_code, status, expiry_date, created_at")
    .eq("tenant_id", auth.session.tenantId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Could not load invitations." }, { status: 500 });
  return NextResponse.json({ invitations: data ?? [] });
}

export async function PATCH(request: Request) {
  const auth = await requireSession(request, { roles: ["Candidate", "Campaign Manager", "Admin"] });
  if (auth.response) return auth.response;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invitation action is invalid." }, { status: 400 });

  const admin = getLooseSupabaseAdmin();
  const update =
    parsed.data.action === "Regenerate Code"
      ? { invitation_code: shortCode("JUK"), status: "Pending", expiry_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10) }
      : { status: parsed.data.action === "Revoke" ? "Revoked" : "Expired" };

  const { data, error } = await admin
    .from("invitations")
    .update(update)
    .eq("id", parsed.data.invitationId)
    .eq("tenant_id", auth.session.tenantId)
    .select("id, invitation_code, status, expiry_date")
    .single();

  if (error || !data) return NextResponse.json({ error: "Could not update invitation." }, { status: 409 });

  await writeAudit({
    tenantId: auth.session.tenantId,
    candidateId: auth.session.candidateId,
    action: "Update",
    module: "Invitation Management",
    recordId: data.id,
    newValue: { action: parsed.data.action, ...data },
  });

  return NextResponse.json({ invitation: data });
}
