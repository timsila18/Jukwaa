import { NextResponse } from "next/server";
import { z } from "zod";
import { getLooseSupabaseAdmin } from "@/lib/supabase";
import { enforceRateLimit, requestKey } from "@/lib/rate-limit";
import { requireSession, requireWorkspaceAccess } from "@/lib/auth-session";
import { getLiveWorkspaceSnapshot } from "@/lib/live-dashboard";

const requestSchema = z.object({
  question: z.string().trim().min(3).max(800),
});

function outputText(response: unknown) {
  if (typeof response !== "object" || response === null) {
    return "";
  }

  const direct = (response as { output_text?: unknown }).output_text;
  if (typeof direct === "string") {
    return direct;
  }

  const output = (response as { output?: unknown }).output;
  if (!Array.isArray(output)) {
    return "";
  }

  return output
    .flatMap((item) => {
      if (typeof item !== "object" || item === null) return [];
      const content = (item as { content?: unknown }).content;
      if (!Array.isArray(content)) return [];
      return content.map((part) => {
        if (typeof part !== "object" || part === null) return "";
        const text = (part as { text?: unknown }).text;
        return typeof text === "string" ? text : "";
      });
    })
    .filter(Boolean)
    .join("\n");
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;
  const access = await requireWorkspaceAccess(auth.session);
  if (access.response) return access.response;

  const limited = await enforceRateLimit(requestKey(request, "ai-assistant"), 20, 60_000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many AI requests. Try again shortly." }, { status: 429 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ask a campaign question between 3 and 800 characters." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI is not configured for this deployment yet." }, { status: 503 });
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const snapshot = await getLiveWorkspaceSnapshot(auth.session, access.access);
  const campaignPosition = String(snapshot.campaign?.position_targeted ?? snapshot.campaign?.position_contesting ?? "").toLowerCase();
  const areaField = campaignPosition.includes("president") || campaignPosition.includes("referendum")
    ? "county_name"
    : ["governor", "senator", "women representative", "woman representative", "women rep", "woman rep"].some((role) => campaignPosition.includes(role))
      ? "constituency_name"
      : campaignPosition.includes("mca")
        ? "polling_station_name"
        : "ward_name";
  const context = {
    campaign: snapshot.campaign,
    workspaceAccess: snapshot.workspace.access,
    summary: snapshot.summary,
    supportersByArea: snapshot.supporters.reduce<Record<string, number>>((totals, supporter) => {
      const area = String(supporter[areaField] || supporter.village_name || supporter.ward_name || "Not assigned");
      totals[area] = (totals[area] ?? 0) + 1;
      return totals;
    }, {}),
    supporterSegments: snapshot.supporters.slice(0, 80).map((supporter) => ({
      county: supporter.county_name,
      constituency: supporter.constituency_name,
      ward: supporter.ward_name,
      village: supporter.village_name,
      station: supporter.polling_station_name,
      supportLevel: supporter.support_level,
      keyIssue: supporter.key_issue,
      volunteerInterest: supporter.volunteer_interest,
    })),
    pollingStationTargets: snapshot.pollingStations.slice(0, 300).map((station) => {
      const registeredVoters = typeof station.registered_voters === "number" ? station.registered_voters : 0;
      const identifiedSupporters = snapshot.supporters.filter((supporter) => String(supporter.polling_station_name ?? "") === String(station.name ?? "")).length;
      return {
        station: station.name,
        county: station.county_name,
        constituency: station.constituency_name,
        ward: station.ward_name,
        centre: station.centre_name,
        registeredVoters,
        recommendedSupporterTarget: registeredVoters ? Math.max(25, Math.ceil(registeredVoters * 0.1)) : 0,
        identifiedSupporters,
        remainingSupporterTarget: registeredVoters ? Math.max(0, Math.max(25, Math.ceil(registeredVoters * 0.1)) - identifiedSupporters) : 0,
      };
    }),
    volunteers: snapshot.volunteers.slice(0, 50).map((volunteer) => ({
      name: volunteer.full_name,
      county: volunteer.county_name,
      constituency: volunteer.constituency_name,
      ward: volunteer.ward_name,
      status: volunteer.status,
      joined: volunteer.join_date,
    })),
    issues: snapshot.issues.slice(0, 80).map((issue) => ({
      title: issue.issue_title,
      category: issue.category,
      county: issue.county_name,
      constituency: issue.constituency_name,
      ward: issue.ward_name,
      village: issue.village_name,
      priority: issue.priority_level,
      status: issue.status,
      mentions: issue.number_of_mentions,
    })),
    tasks: snapshot.tasks.slice(0, 60),
    events: snapshot.events.slice(0, 40),
    communications: {
      rooms: snapshot.communicationRooms.slice(0, 30),
      messages: snapshot.communicationMessages.slice(0, 30),
    },
    aiContent: snapshot.aiContentAssets.slice(0, 30),
  };

  const upstream = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions:
        "You are JUKWAA AI, a concise political campaign intelligence assistant. Use only the provided live workspace context. Ground recommendations in the candidate's actual elective area: counties for presidential races, constituencies for governor/senator/women representative races, wards for MP races, and local units or polling stations for MCA races. Give practical next steps, call out missing data, and never present predictions as certainty.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Campaign context:\n${JSON.stringify(context)}\n\nQuestion:\n${parsed.data.question}`,
            },
          ],
        },
      ],
      max_output_tokens: 700,
    }),
  });

  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(
      { error: "JUKWAA AI could not generate a response right now.", detail: typeof payload === "object" && payload !== null ? (payload as { error?: { message?: string } }).error?.message : undefined },
      { status: 502 },
    );
  }

  const usage = typeof payload === "object" && payload !== null ? (payload as { usage?: { input_tokens?: number; output_tokens?: number } }).usage : undefined;
  const admin = getLooseSupabaseAdmin();
  await admin.from("ai_usage_events").insert({
      tenant_id: auth.session.tenantId,
      candidate_id: auth.session.candidateId,
      feature: "Campaign Assistant",
      prompt_tokens: usage?.input_tokens ?? 0,
      output_tokens: usage?.output_tokens ?? 0,
      model,
      status: "Completed",
    });

  return NextResponse.json({
    answer: outputText(payload) || "JUKWAA AI returned an empty response. Try asking a more specific campaign question.",
    model,
  });
}
