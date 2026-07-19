import { NextResponse } from "next/server";
import { getLooseSupabaseAdmin } from "@/lib/supabase";
import { writeAudit } from "@/lib/server-workflows";

type DeliveryPayload = {
  id?: string;
  status?: string;
  phoneNumber?: string;
  networkCode?: string;
  failureReason?: string;
  retryCount?: string | number;
};

type MessageDeliveryRow = {
  id: string;
  tenant_id: string;
  candidate_id: string;
  recipient_phones?: unknown;
  provider_message_ids?: unknown;
  provider_response?: unknown;
  delivered_count?: number | null;
  failed_count?: number | null;
};

function deliveryStatus(value?: string) {
  const normalized = String(value ?? "").toLowerCase();
  if (["success", "delivered", "sent"].some((status) => normalized.includes(status))) return "Delivered";
  if (["failed", "rejected", "expired", "undeliverable"].some((status) => normalized.includes(status))) return "Failed";
  return "Queued";
}

async function parsePayload(request: Request): Promise<DeliveryPayload> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return await request.json().catch(() => ({}));
  }

  const form = await request.formData().catch(() => null);
  if (!form) return {};
  return {
    id: String(form.get("id") ?? form.get("messageId") ?? ""),
    status: String(form.get("status") ?? ""),
    phoneNumber: String(form.get("phoneNumber") ?? form.get("phone") ?? ""),
    networkCode: String(form.get("networkCode") ?? ""),
    failureReason: String(form.get("failureReason") ?? ""),
    retryCount: String(form.get("retryCount") ?? ""),
  };
}

function authorized(request: Request) {
  const expected = process.env.AFRICASTALKING_CALLBACK_SECRET;
  if (!expected) return true;
  const actual = request.headers.get("x-jukwaa-callback-secret") || new URL(request.url).searchParams.get("secret");
  return actual === expected;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized delivery report." }, { status: 401 });
  }

  const payload = await parsePayload(request);
  const providerMessageId = payload.id?.trim();
  if (!providerMessageId) {
    return NextResponse.json({ error: "Missing Africa's Talking message id." }, { status: 400 });
  }

  const status = deliveryStatus(payload.status);
  const supabase = getLooseSupabaseAdmin();
  const { data: existing, error: lookupError } = await supabase
    .from("communication_messages")
    .select("id, tenant_id, candidate_id, recipient_phones, provider_message_ids, provider_response, delivered_count, failed_count")
    .order("created_at", { ascending: false })
    .limit(500);

  if (lookupError) {
    return NextResponse.json({ error: "Could not match delivery report.", detail: lookupError.message }, { status: 500 });
  }
  const rows = (existing ?? []) as MessageDeliveryRow[];
  const matched = rows.find((message) => Array.isArray(message.provider_message_ids) && message.provider_message_ids.includes(providerMessageId));
  if (!matched?.id) {
    return NextResponse.json({ ok: true, matched: false, message: "Delivery report accepted but no matching message was found." });
  }

  const report = {
    provider: "Africa's Talking",
    messageId: providerMessageId,
    status: payload.status,
    phoneNumber: payload.phoneNumber,
    networkCode: payload.networkCode,
    failureReason: payload.failureReason,
    retryCount: payload.retryCount,
    receivedAt: new Date().toISOString(),
  };
  const previousResponse = typeof matched.provider_response === "object" && matched.provider_response ? matched.provider_response as Record<string, unknown> : {};
  const previousReports = Array.isArray(previousResponse.deliveryReports) ? previousResponse.deliveryReports : [];
  const recipientTotal = Array.isArray(matched.recipient_phones) ? matched.recipient_phones.length : 0;
  const deliveredCount = Number(matched.delivered_count ?? 0) + (status === "Delivered" ? 1 : 0);
  const failedCount = Number(matched.failed_count ?? 0) + (status === "Failed" ? 1 : 0);
  const aggregateStatus = recipientTotal > 0 && deliveredCount >= recipientTotal
    ? "Delivered"
    : recipientTotal > 0 && failedCount >= recipientTotal
      ? "Failed"
      : deliveredCount > 0 || failedCount > 0
        ? "Partially Delivered"
        : "Queued";

  const { error: updateError } = await supabase
    .from("communication_messages")
    .update({
      delivery_status: aggregateStatus,
      status: aggregateStatus === "Delivered" ? "Delivered" : "Queued",
      delivered_count: deliveredCount,
      failed_count: failedCount,
      provider_response: { ...previousResponse, deliveryReports: [...previousReports, report] },
      delivery_error: status === "Failed" ? (payload.failureReason || "Africa's Talking reported delivery failure.") : null,
      last_delivery_report_at: report.receivedAt,
    })
    .eq("id", matched.id);

  if (updateError) {
    return NextResponse.json({ error: "Could not update delivery report.", detail: updateError.message }, { status: 500 });
  }

  await writeAudit({
    tenantId: String(matched.tenant_id),
    candidateId: String(matched.candidate_id),
    action: "Delivery Report",
    module: "Communications",
    recordId: String(matched.id),
    newValue: report,
  });

  return NextResponse.json({ ok: true, matched: true, status });
}
