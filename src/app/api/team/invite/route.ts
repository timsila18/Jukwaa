import { NextResponse } from "next/server";
import { z } from "zod";
import { getLooseSupabaseAdmin } from "@/lib/supabase";
import { getDefaultWorkspace, shortCode, writeAudit } from "@/lib/server-workflows";

const schema = z.object({
  fullName: z.string().trim().min(2),
  phoneNumber: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  role: z.enum(["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Village Coordinator", "Volunteer", "Polling Agent", "Media Team", "Data Clerk", "Admin"]),
  geography: z.string().trim().optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (!parsed.data.phoneNumber && !parsed.data.email)) {
    return NextResponse.json({ error: "Name, role, and phone or email are required." }, { status: 400 });
  }

  const workspace = await getDefaultWorkspace();
  const supabase = getLooseSupabaseAdmin();
  const invitationCode = shortCode("JUK");
  const { data, error } = await supabase.from("invitations").insert({
    tenant_id: workspace.tenantId,
    candidate_id: workspace.candidateId,
    invited_name: parsed.data.fullName,
    invited_phone: parsed.data.phoneNumber || null,
    invited_email: parsed.data.email || null,
    role: parsed.data.role,
    invitation_code: invitationCode,
    status: "Pending",
    expiry_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  }).select("id").single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not create invitation.", detail: error?.message }, { status: 409 });
  }

  await writeAudit({
    tenantId: workspace.tenantId,
    candidateId: workspace.candidateId,
    action: "Create",
    module: "Invitation",
    recordId: data.id,
    newValue: { ...parsed.data, invitationCode },
  });

  return NextResponse.json({ invitationId: data.id, invitationCode });
}
