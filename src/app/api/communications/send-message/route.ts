import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, requireWorkspaceAccess } from "@/lib/auth-session";
import { enforceRateLimit, requestKey } from "@/lib/rate-limit";
import { writeAudit } from "@/lib/server-workflows";
import { getLooseSupabaseAdmin } from "@/lib/supabase";

const sendMessageSchema = z.object({
  channel: z.enum(["Broadcast SMS", "WhatsApp"]),
  subject: z.string().trim().min(2).max(120),
  body: z.string().trim().min(1).max(1000),
  audience: z.string().trim().optional().or(z.literal("")),
  recipients: z.array(z.string().trim().min(7)).min(1).max(200),
});

type ProviderResult = {
  providerName: string;
  deliveryStatus: "Sent" | "Partially Sent" | "Needs Provider" | "Failed";
  providerResponse?: unknown;
  deliveryError?: string | null;
  launchUrl?: string;
  launchLabel?: string;
};

function normalizeKenyaPhone(value: string) {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  let normalized = digits;
  if (hasPlus) normalized = digits;
  else if (digits.startsWith("0")) normalized = `254${digits.slice(1)}`;
  else if ((digits.startsWith("7") || digits.startsWith("1")) && digits.length === 9) normalized = `254${digits}`;

  if (!normalized.startsWith("254") || normalized.length < 12 || normalized.length > 15) return null;
  return `+${normalized}`;
}

function smsLaunchUrl(phone: string, body: string) {
  return `sms:${encodeURIComponent(phone)}?body=${encodeURIComponent(body)}`;
}

function whatsappLaunchUrl(phone: string, body: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(body)}`;
}

async function sendSms(recipients: string[], body: string): Promise<ProviderResult> {
  const username = process.env.AFRICASTALKING_USERNAME;
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const senderId = process.env.AFRICASTALKING_SENDER_ID;

  if (!username || !apiKey) {
    return {
      providerName: "Device SMS",
      deliveryStatus: "Needs Provider",
      deliveryError: "Automated SMS provider is not configured. Opening the device SMS app for the first recipient.",
      launchUrl: smsLaunchUrl(recipients[0], body),
      launchLabel: "Open SMS app",
    };
  }

  const form = new URLSearchParams();
  form.set("username", username);
  form.set("to", recipients.join(","));
  form.set("message", body);
  if (senderId) form.set("from", senderId);

  const response = await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      apiKey,
    },
    body: form,
  });
  const payload = await response.json().catch(() => ({}));
  return {
    providerName: "Africa's Talking SMS",
    deliveryStatus: response.ok ? "Sent" : "Failed",
    providerResponse: payload,
    deliveryError: response.ok ? null : "SMS provider rejected the message.",
  };
}

async function sendWhatsApp(recipients: string[], body: string): Promise<ProviderResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !token) {
    return {
      providerName: "WhatsApp Launcher",
      deliveryStatus: "Needs Provider",
      deliveryError: "Automated WhatsApp provider is not configured. Opening WhatsApp for the first recipient.",
      launchUrl: whatsappLaunchUrl(recipients[0], body),
      launchLabel: "Open WhatsApp",
    };
  }

  const results = await Promise.all(
    recipients.map(async (phone) => {
      const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone.replace(/\D/g, ""),
          type: "text",
          text: { preview_url: false, body },
        }),
      });
      return {
        phone,
        ok: response.ok,
        response: await response.json().catch(() => ({})),
      };
    }),
  );

  const sent = results.filter((result) => result.ok).length;
  return {
    providerName: "WhatsApp Cloud API",
    deliveryStatus: sent === recipients.length ? "Sent" : sent > 0 ? "Partially Sent" : "Failed",
    providerResponse: results,
    deliveryError: sent === recipients.length ? null : `${recipients.length - sent} WhatsApp message(s) were not accepted by the provider.`,
  };
}

async function insertMessage(input: {
  tenantId: string;
  candidateId: string;
  memberId: string | null;
  channel: "Broadcast SMS" | "WhatsApp";
  subject: string;
  body: string;
  audience: string;
  recipients: string[];
  result: ProviderResult;
}) {
  const supabase = getLooseSupabaseAdmin();
  const payload = {
    tenant_id: input.tenantId,
    candidate_id: input.candidateId,
    channel: input.channel,
    subject: input.subject,
    body: input.body,
    sender_member_id: input.memberId,
    audience: input.audience,
    recipient_phones: input.recipients,
    status: input.result.deliveryStatus === "Sent" || input.result.deliveryStatus === "Partially Sent" ? "Sent" : "Queued",
    sent_at: input.result.deliveryStatus === "Sent" || input.result.deliveryStatus === "Partially Sent" ? new Date().toISOString() : null,
    delivery_status: input.result.deliveryStatus,
    provider_name: input.result.providerName,
    provider_response: input.result.providerResponse ?? {},
    delivery_error: input.result.deliveryError ?? null,
  };

  const { data, error } = await supabase.from("communication_messages").insert(payload).select("id").single();
  if (!error && data?.id) return String(data.id);

  if (!error?.message?.toLowerCase().includes("duplicate")) {
    throw new Error(error?.message ?? "Could not save message delivery record.");
  }

  const retry = {
    ...payload,
    subject: `${input.subject} - ${new Date().toISOString().slice(0, 19).replace("T", " ")}`,
  };
  const { data: retryData, error: retryError } = await supabase.from("communication_messages").insert(retry).select("id").single();
  if (retryError || !retryData?.id) throw new Error(retryError?.message ?? "Could not save message delivery record.");
  return String(retryData.id);
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(requestKey(request, "communications-send"), 20, 60_000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many message attempts. Try again shortly." }, { status: 429 });
  }

  const auth = await requireSession(request, {
    roles: ["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Media Team", "Admin"],
  });
  if (auth.response) return auth.response;

  const access = await requireWorkspaceAccess(auth.session);
  if (access.response) return access.response;

  const parsed = sendMessageSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Message details are invalid." }, { status: 400 });
  }

  const recipients = Array.from(new Set(parsed.data.recipients.map(normalizeKenyaPhone).filter(Boolean) as string[]));
  if (!recipients.length) {
    return NextResponse.json({ error: "Add at least one valid Kenyan phone number." }, { status: 400 });
  }

  const result = parsed.data.channel === "WhatsApp"
    ? await sendWhatsApp(recipients, parsed.data.body)
    : await sendSms(recipients, parsed.data.body);

  const id = await insertMessage({
    tenantId: auth.session.tenantId,
    candidateId: auth.session.candidateId,
    memberId: auth.session.memberId || null,
    channel: parsed.data.channel,
    subject: parsed.data.subject,
    body: parsed.data.body,
    audience: parsed.data.audience || "Campaign audience",
    recipients,
    result,
  });

  await writeAudit({
    tenantId: auth.session.tenantId,
    candidateId: auth.session.candidateId,
    action: result.deliveryStatus === "Sent" || result.deliveryStatus === "Partially Sent" ? "Send" : "Queue",
    module: "Communications",
    recordId: id,
    newValue: {
      channel: parsed.data.channel,
      subject: parsed.data.subject,
      audience: parsed.data.audience,
      recipients: recipients.length,
      deliveryStatus: result.deliveryStatus,
      providerName: result.providerName,
    },
  });

  return NextResponse.json({
    id,
    status: result.deliveryStatus,
    providerName: result.providerName,
    launchUrl: result.launchUrl,
    launchLabel: result.launchLabel,
    message: result.deliveryError ?? "Message processed.",
  });
}
