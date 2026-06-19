import crypto from "crypto";
import { NextResponse } from "next/server";
import { getLooseSupabaseAdmin } from "@/lib/supabase";
import { writeAudit } from "@/lib/server-workflows";

type CallbackItem = {
  Name?: string;
  Value?: string | number;
};

function callbackValue(items: CallbackItem[] | undefined, name: string) {
  return items?.find((item) => item.Name === name)?.Value;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function normalizePhone(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

export async function POST(request: Request) {
  const configuredSecret = process.env.MPESA_CALLBACK_SECRET;
  const suppliedSecret = request.headers.get("x-jukwaa-mpesa-secret") ?? new URL(request.url).searchParams.get("token") ?? "";
  if (!configuredSecret || !safeEqual(suppliedSecret, configuredSecret)) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Unauthorized callback" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const callback = payload?.Body?.stkCallback;
  const checkoutRequestId = typeof callback?.CheckoutRequestID === "string" ? callback.CheckoutRequestID : null;
  const merchantRequestId = typeof callback?.MerchantRequestID === "string" ? callback.MerchantRequestID : null;
  const resultCode = Number(callback?.ResultCode ?? -1);
  const metadata = Array.isArray(callback?.CallbackMetadata?.Item) ? callback.CallbackMetadata.Item as CallbackItem[] : [];
  const receipt = callbackValue(metadata, "MpesaReceiptNumber");
  const amount = callbackValue(metadata, "Amount");
  const phone = callbackValue(metadata, "PhoneNumber");
  const status = resultCode === 0 ? "Confirmed" : "Failed";

  if (!checkoutRequestId) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Rejected without checkout id" }, { status: 400 });
  }

  const supabase = getLooseSupabaseAdmin();
  const { data: payment } = await supabase
    .from("workspace_activation_payments")
    .select("id, tenant_id, candidate_id, amount_kes, phone_number, status")
    .eq("checkout_request_id", checkoutRequestId)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Unknown checkout id" }, { status: 404 });
  }

  if (payment.status === "Confirmed") {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Already confirmed" });
  }

  if (resultCode === 0) {
    if (typeof receipt !== "string" || !receipt.trim()) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Confirmed callback missing receipt" }, { status: 400 });
    }

    if (Number(amount) !== Number(payment.amount_kes)) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Amount mismatch" }, { status: 400 });
    }

    if (phone && normalizePhone(phone) !== normalizePhone(payment.phone_number)) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Phone mismatch" }, { status: 400 });
    }
  }

  await supabase
    .from("workspace_activation_payments")
    .update({
      status,
      merchant_request_id: merchantRequestId,
      mpesa_receipt_number: typeof receipt === "string" ? receipt : null,
      raw_payload: payload,
      confirmed_at: resultCode === 0 ? new Date().toISOString() : null,
    })
    .eq("checkout_request_id", checkoutRequestId);

  await supabase
    .from("mpesa_transaction_logs")
    .update({
      status,
      merchant_request_id: merchantRequestId,
      mpesa_receipt_number: typeof receipt === "string" ? receipt : null,
      raw_payload: payload,
    })
    .eq("checkout_request_id", checkoutRequestId);

  if (payment) {
    await writeAudit({
      tenantId: payment.tenant_id,
      candidateId: payment.candidate_id,
      action: "Update",
      module: "M-Pesa Callback",
      recordId: payment.id,
      newValue: { status, checkoutRequestId, receipt, amount, phone },
    });
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
