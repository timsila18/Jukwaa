import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit, requestKey } from "@/lib/rate-limit";
import { getLooseSupabaseAdmin } from "@/lib/supabase";

type PublicQuestionRow = { id: string; question_text: string; question_type: string; required: boolean; display_order: number };
type PublicOptionRow = { id: string; question_id: string; option_text: string; display_order: number };

const publicResponseSchema = z.object({
  respondentName: z.string().trim().optional().or(z.literal("")),
  phoneNumber: z.string().trim().optional().or(z.literal("")),
  countyName: z.string().trim().optional().or(z.literal("")),
  constituencyName: z.string().trim().optional().or(z.literal("")),
  wardName: z.string().trim().optional().or(z.literal("")),
  pollingStationName: z.string().trim().optional().or(z.literal("")),
  ageGroup: z.string().trim().optional().or(z.literal("")),
  gender: z.string().trim().optional().or(z.literal("")),
  consentToProcess: z.boolean().default(true),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    optionId: z.string().uuid().optional().or(z.literal("")),
    textAnswer: z.string().trim().optional().or(z.literal("")),
    numericAnswer: z.coerce.number().optional(),
  })).min(1),
});

export async function GET(_request: Request, context: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await context.params;
  if (!z.string().uuid().safeParse(pollId).success) {
    return NextResponse.json({ error: "Invalid poll link." }, { status: 400 });
  }

  const supabase = getLooseSupabaseAdmin();
  const { data: poll, error } = await supabase
    .from("polls")
    .select("id, tenant_id, candidate_id, title, description, poll_type, status, visibility, start_date, end_date, require_consent, collect_location, collect_demographics, methodology_note")
    .eq("id", pollId)
    .limit(1)
    .maybeSingle();
  if (error || !poll?.id || poll.visibility !== "Public Link" || !["Active", "Scheduled"].includes(String(poll.status))) {
    return NextResponse.json({ error: "This poll is not open to the public right now." }, { status: 404 });
  }

  const [{ data: questions }, { data: options }, { data: campaign }] = await Promise.all([
    supabase.from("poll_questions").select("id, question_text, question_type, required, display_order").eq("poll_id", pollId).eq("tenant_id", poll.tenant_id).order("display_order", { ascending: true }),
    supabase.from("poll_options").select("id, question_id, option_text, display_order").eq("tenant_id", poll.tenant_id).order("display_order", { ascending: true }),
    supabase.from("campaign_settings").select("candidate_name, campaign_name, position_targeted, county, constituency, slogan").eq("tenant_id", poll.tenant_id).limit(1).maybeSingle(),
  ]);

  const questionRows = (Array.isArray(questions) ? questions : []) as PublicQuestionRow[];
  const optionRows = (Array.isArray(options) ? options : []) as PublicOptionRow[];
  const questionIds = new Set(questionRows.map((question) => question.id));
  return NextResponse.json({
    poll: {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      pollType: poll.poll_type,
      requireConsent: poll.require_consent,
      collectLocation: poll.collect_location,
      collectDemographics: poll.collect_demographics,
      methodologyNote: poll.methodology_note,
    },
    campaign,
    questions: questionRows,
    options: optionRows.filter((option) => questionIds.has(option.question_id)),
  });
}

export async function POST(request: Request, context: { params: Promise<{ pollId: string }> }) {
  const limited = await enforceRateLimit(requestKey(request, "public-poll"), 20, 60_000);
  if (!limited.allowed) return NextResponse.json({ error: "Too many submissions. Try again shortly." }, { status: 429 });

  const { pollId } = await context.params;
  const parsed = publicResponseSchema.safeParse(await request.json().catch(() => ({})));
  if (!z.string().uuid().safeParse(pollId).success || !parsed.success) {
    return NextResponse.json({ error: "Poll response is invalid." }, { status: 400 });
  }

  const supabase = getLooseSupabaseAdmin();
  const { data: poll } = await supabase
    .from("polls")
    .select("id, tenant_id, candidate_id, status, visibility, require_consent")
    .eq("id", pollId)
    .limit(1)
    .maybeSingle();
  if (!poll?.id || poll.visibility !== "Public Link" || !["Active", "Scheduled"].includes(String(poll.status))) {
    return NextResponse.json({ error: "This poll is not accepting responses." }, { status: 404 });
  }
  if (poll.require_consent && !parsed.data.consentToProcess) {
    return NextResponse.json({ error: "Consent is required before submitting." }, { status: 400 });
  }

  const phoneHash = parsed.data.phoneNumber
    ? createHash("sha256").update(parsed.data.phoneNumber.replace(/\D/g, "")).digest("hex")
    : null;
  const { data: response, error } = await supabase
    .from("poll_responses")
    .insert({
      tenant_id: poll.tenant_id,
      candidate_id: poll.candidate_id,
      poll_id: poll.id,
      respondent_name: parsed.data.respondentName || null,
      phone_number: parsed.data.phoneNumber || null,
      phone_hash: phoneHash,
      collection_method: "Public Link",
      age_group: parsed.data.ageGroup || null,
      gender: parsed.data.gender || null,
      consent_to_process: parsed.data.consentToProcess,
      response_metadata: {
        countyName: parsed.data.countyName || null,
        constituencyName: parsed.data.constituencyName || null,
        wardName: parsed.data.wardName || null,
        pollingStationName: parsed.data.pollingStationName || null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    })
    .select("id")
    .single();
  if (error || !response?.id) return NextResponse.json({ error: "Could not submit response." }, { status: 500 });

  const answers = parsed.data.answers.map((answer) => ({
    tenant_id: poll.tenant_id,
    response_id: response.id,
    poll_id: poll.id,
    question_id: answer.questionId,
    option_id: answer.optionId || null,
    text_answer: answer.textAnswer || null,
    numeric_answer: answer.numericAnswer ?? null,
  }));
  const { error: answerError } = await supabase.from("poll_answers").insert(answers);
  if (answerError) return NextResponse.json({ error: "Response was received, but answers could not be saved." }, { status: 500 });

  return NextResponse.json({ id: response.id, status: "Submitted" });
}
