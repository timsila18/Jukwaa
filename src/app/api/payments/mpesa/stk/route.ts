import { NextResponse } from "next/server";
import { z } from "zod";
import { getLooseSupabaseAdmin } from "@/lib/supabase";
import { enforceRateLimit, requestKey } from "@/lib/rate-limit";
import { writeAudit } from "@/lib/server-workflows";

const schema = z.object({
  applicationId: z.string().uuid().optional(),
  accountReference: z.string().trim().min(4).max(12),
  phoneNumber: z.string().trim().min(9),
  amountKes: z.coerce.number().positive(),
});

function normalizeSafaricomPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
}

function mpesaBaseUrl() {
  return process.env.MPESA_ENV === "sandbox" ? "https://sandbox.safaricom.co.ke" : "https://api.safaricom.co.ke";
}

function mpesaTimestamp() {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

async function mpesaAccessToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  if (!consumerKey || !consumerSecret) {
    throw new Error("M-Pesa consumer credentials are not configured.");
  }

  const tokenResponse = await fetch(`${mpesaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
    },
  });

  const tokenPayload = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || typeof tokenPayload.access_token !== "string") {
    throw new Error("Could not get an M-Pesa access token.");
  }

  return tokenPayload.access_token as string;
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(requestKey(request, "mpesa-stk"), 12, 60_000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many M-Pesa requests. Try again shortly." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Phone, amount, and account reference are required for STK Push." }, { status: 400 });
  }

  const shortcode = process.env.MPESA_SHORT_CODE || process.env.MPESA_PAYBILL_NUMBER;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;
  if (!shortcode || !passkey || !callbackUrl) {
    return NextResponse.json({ error: "M-Pesa STK Push is not fully configured." }, { status: 503 });
  }

  const input = parsed.data;
  const phone = normalizeSafaricomPhone(input.phoneNumber);
  const supabase = getLooseSupabaseAdmin();
  const { data: application } = await supabase
    .from("candidate_onboarding_applications")
    .select("id, tenant_id, candidate_id")
    .or(`id.eq.${input.applicationId ?? "00000000-0000-0000-0000-000000000000"},payment_reference.eq.${input.accountReference}`)
    .limit(1)
    .maybeSingle();

  if (!application) {
    return NextResponse.json({ error: "No candidate onboarding application matches that account reference." }, { status: 404 });
  }

  try {
    const timestamp = mpesaTimestamp();
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
    const token = await mpesaAccessToken();
    const stkResponse = await fetch(`${mpesaBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.ceil(input.amountKes),
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: input.accountReference,
        TransactionDesc: "JUKWAA workspace activation",
      }),
    });

    const stkPayload = await stkResponse.json().catch(() => ({}));
    const checkoutRequestId = typeof stkPayload.CheckoutRequestID === "string" ? stkPayload.CheckoutRequestID : null;
    const merchantRequestId = typeof stkPayload.MerchantRequestID === "string" ? stkPayload.MerchantRequestID : null;

    await supabase.from("workspace_activation_payments").insert({
      onboarding_application_id: application.id,
      tenant_id: application.tenant_id,
      candidate_id: application.candidate_id,
      phone_number: phone,
      amount_kes: input.amountKes,
      channel: "STK Push",
      paybill_number: shortcode,
      account_reference: input.accountReference,
      checkout_request_id: checkoutRequestId,
      merchant_request_id: merchantRequestId,
      raw_payload: stkPayload,
      status: "Pending",
    });

    await supabase.from("mpesa_transaction_logs").insert({
      tenant_id: application.tenant_id,
      candidate_id: application.candidate_id,
      purpose: "Subscription",
      phone,
      amount_kes: input.amountKes,
      channel: "STK Push",
      account_reference: input.accountReference,
      checkout_request_id: checkoutRequestId,
      merchant_request_id: merchantRequestId,
      raw_payload: stkPayload,
      status: stkResponse.ok ? "Pending" : "Failed",
    });

    await supabase.from("candidate_onboarding_applications").update({ status: "Payment Submitted" }).eq("id", application.id);
    await writeAudit({
      tenantId: application.tenant_id,
      candidateId: application.candidate_id,
      action: "Create",
      module: "M-Pesa STK Push",
      recordId: application.id,
      newValue: { accountReference: input.accountReference, amountKes: input.amountKes, checkoutRequestId, ok: stkResponse.ok },
    });

    if (!stkResponse.ok) {
      return NextResponse.json({ error: "M-Pesa rejected the STK Push request.", detail: stkPayload }, { status: 502 });
    }

    return NextResponse.json({
      status: "STK Push Sent",
      checkoutRequestId,
      merchantRequestId,
      customerMessage: typeof stkPayload.CustomerMessage === "string" ? stkPayload.CustomerMessage : "Check your phone and enter M-Pesa PIN.",
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "M-Pesa STK Push failed." }, { status: 502 });
  }
}
