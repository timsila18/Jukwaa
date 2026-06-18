import { NextResponse } from "next/server";
import { z } from "zod";
import { getLooseSupabaseAdmin } from "@/lib/supabase";
import { writeAudit } from "@/lib/server-workflows";

const schema = z.object({
  applicationId: z.string().uuid().optional(),
  accountReference: z.string().trim().min(4),
  phoneNumber: z.string().trim().min(7),
  amountKes: z.coerce.number().positive(),
  mpesaReceiptNumber: z.string().trim().optional().or(z.literal("")),
  channel: z.enum(["Manual Paybill", "STK Push", "Bank Transfer"]).default("Manual Paybill"),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payment confirmation details are incomplete." }, { status: 400 });
  }

  const supabase = getLooseSupabaseAdmin();
  const input = parsed.data;

  const { data: application } = await supabase
    .from("candidate_onboarding_applications")
    .select("id, tenant_id, candidate_id")
    .or(`id.eq.${input.applicationId ?? "00000000-0000-0000-0000-000000000000"},payment_reference.eq.${input.accountReference}`)
    .limit(1)
    .maybeSingle();

  const { data: payment, error } = await supabase.from("workspace_activation_payments").insert({
    onboarding_application_id: application?.id ?? null,
    tenant_id: application?.tenant_id ?? null,
    candidate_id: application?.candidate_id ?? null,
    phone_number: input.phoneNumber,
    amount_kes: input.amountKes,
    channel: input.channel,
    paybill_number: process.env.MPESA_PAYBILL_NUMBER || "CONFIGURE_PAYBILL",
    account_reference: input.accountReference,
    mpesa_receipt_number: input.mpesaReceiptNumber || null,
    status: "Pending",
  }).select("id").single();

  if (error || !payment) {
    return NextResponse.json({ error: "Could not record payment confirmation.", detail: error?.message }, { status: 409 });
  }

  if (application) {
    await supabase.from("candidate_onboarding_applications").update({ status: "Payment Submitted" }).eq("id", application.id);
    await writeAudit({
      tenantId: application.tenant_id,
      candidateId: application.candidate_id,
      action: "Create",
      module: "Payment Confirmation",
      recordId: payment.id,
      newValue: input,
    });
  }

  return NextResponse.json({ paymentId: payment.id, status: "Pending verification" });
}
