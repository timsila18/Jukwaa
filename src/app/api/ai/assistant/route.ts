import { NextResponse } from "next/server";
import { z } from "zod";
import { getLooseSupabaseAdmin } from "@/lib/supabase";
import { enforceRateLimit, requestKey } from "@/lib/rate-limit";
import { requireSession, requireWorkspaceAccess } from "@/lib/auth-session";
import {
  aiStrategyQueue,
  budgetVarianceRows,
  communityIssues,
  donations,
  expenses,
  pollingAnalytics,
  summarizeCampaign,
  summarizeElectionOps,
  summarizePhaseFive,
  summarizeGovernance,
  summarizePhaseTwo,
  supporterMobilizationAnalytics,
  territoryCoverage,
  volunteerPerformance,
} from "@/lib/demo-data";

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
  const context = {
    campaign: summarizeCampaign(),
    fieldOperations: summarizePhaseTwo(),
    electionDay: summarizeElectionOps(),
    governance: summarizeGovernance(),
    enterprise: summarizePhaseFive(),
    pollingStations: pollingAnalytics().slice(0, 8),
    volunteerPerformance: volunteerPerformance().slice(0, 6),
    territoryCoverage: territoryCoverage(),
    mobilization: supporterMobilizationAnalytics(),
    communityIssues,
    aiRecommendations: aiStrategyQueue(),
    budgets: budgetVarianceRows(),
    donations,
    expenses,
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
        "You are JUKWAA AI, a concise political campaign intelligence assistant. Use only the provided campaign context. Give practical recommendations, call out uncertainty, and never present predictions as certainty.",
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
