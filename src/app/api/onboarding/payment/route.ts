import { NextResponse } from "next/server";
import { z } from "zod";
import { getLooseSupabaseAdmin } from "@/lib/supabase";
import { writeAudit } from "@/lib/server-workflows";
import { enforceRateLimit, requestKey } from "@/lib/rate-limit";

const schema = z.object({
  applicationId: z.string().uuid().optional(),
  accountReference: z.string().trim().min(4),
  phoneNumber: z.string().trim().min(7),
  amountKes: z.coerce.number().positive(),
  mpesaReceiptNumber: z.string().trim().optional().or(z.literal("")),
  channel: z.enum(["Manual Paybill", "STK Push", "Bank Transfer"]).default("Manual Paybill"),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(requestKey(request, "manual-payment"), 8, 60_000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many payment submissions. Try again shortly." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payment confirmation details are incomplete." }, { status: 400 });
  }

  const supabase = getLooseSupabaseAdmin();
  const input = parsed.data;

  const { data: application } = await supabase
    .from("candidate_onboarding_applications")
    .select("id, tenant_id, candidate_id, amount_due_kes, payment_reference")
    .or(`id.eq.${input.applicationId ?? "00000000-0000-0000-0000-000000000000"},payment_reference.eq.${input.accountReference}`)
    .limit(1)
    .maybeSingle();

  if (!application?.id || !application.tenant_id || !application.candidate_id) {
    return NextResponse.json({ error: "No candidate application matches that payment reference." }, { status: 404 });
  }

  if (String(application.payment_reference ?? "") !== input.accountReference) {
    return NextResponse.json({ error: "Payment reference does not match the candidate application." }, { status: 403 });
  }

  if (Number(application.amount_due_kes) !== Number(input.amountKes)) {
    return NextResponse.json({ error: "Payment amount does not match the invoice amount." }, { status: 400 });
  }

  const { data: payment, error } = await supabase.from("workspace_activation_payments").insert({
    onboarding_application_id: application.id,
    tenant_id: application.tenant_id,
    candidate_id: application.candidate_id,
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

  await supabase.from("candidate_onboarding_applications").update({ status: "Payment Submitted" }).eq("id", application.id);
  await writeAudit({
    tenantId: application.tenant_id,
    candidateId: application.candidate_id,
    action: "Create",
    module: "Payment Confirmation",
    recordId: payment.id,
    newValue: input,
  });

  return NextResponse.json({ paymentId: payment.id, status: "Pending verification" });
}
