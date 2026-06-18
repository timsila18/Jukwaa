import { NextResponse } from "next/server";
import { z } from "zod";
import { getLooseSupabaseAdmin } from "@/lib/supabase";
import { writeAudit } from "@/lib/server-workflows";

const schema = z.object({
  applicationId: z.string().uuid(),
  paymentId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "applicationId is required." }, { status: 400 });
  }

  const supabase = getLooseSupabaseAdmin();
  const { data: application, error } = await supabase
    .from("candidate_onboarding_applications")
    .select("id, tenant_id, candidate_id")
    .eq("id", parsed.data.applicationId)
    .single();

  if (error || !application?.tenant_id || !application?.candidate_id) {
    return NextResponse.json({ error: "Onboarding application was not found or is missing workspace links." }, { status: 404 });
  }

  await supabase.from("candidate_onboarding_applications").update({ status: "Activated", activated_at: new Date().toISOString() }).eq("id", application.id);
  await supabase.from("candidates").update({ active_status: "Active", verification_status: "Verified" }).eq("id", application.candidate_id);
  await supabase.from("campaign_settings").update({ active_status: "Active" }).eq("candidate_id", application.candidate_id);
  await supabase.from("campaign_members").update({ status: "Active" }).eq("candidate_id", application.candidate_id).eq("role", "Candidate");
  await supabase.from("workspace_subscriptions").update({ status: "Active" }).eq("candidate_id", application.candidate_id);

  if (parsed.data.paymentId) {
    await supabase.from("workspace_activation_payments").update({ status: "Confirmed", confirmed_at: new Date().toISOString() }).eq("id", parsed.data.paymentId);
  }

  await writeAudit({
    tenantId: application.tenant_id,
    candidateId: application.candidate_id,
    action: "Update",
    module: "Workspace Activation",
    recordId: application.id,
    newValue: { status: "Activated" },
  });

  return NextResponse.json({ status: "Activated", tenantId: application.tenant_id, candidateId: application.candidate_id });
}
