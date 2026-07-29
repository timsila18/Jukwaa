import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { constituenciesForCounty, wardsForConstituency, wardsForCounty } from "@/lib/kenya-geography";
import { enforceRateLimit, requestKey } from "@/lib/rate-limit";
import { getLooseSupabaseAdmin } from "@/lib/supabase";

type PublicQuestionRow = { id: string; question_text: string; question_type: string; required: boolean; display_order: number };
type PublicOptionRow = { id: string; question_id: string; option_text: string; display_order: number };

const publicResponseSchema = z.object({
  respondentName: z.string().trim().max(120).optional().or(z.literal("")),
  phoneNumber: z.string().trim().max(24).optional().or(z.literal("")),
  countyName: z.string().trim().max(100).optional().or(z.literal("")),
  constituencyName: z.string().trim().max(120).optional().or(z.literal("")),
  wardName: z.string().trim().max(120).optional().or(z.literal("")),
  pollingStationName: z.string().trim().max(180).optional().or(z.literal("")),
  ageGroup: z.string().trim().max(40).optional().or(z.literal("")),
  gender: z.string().trim().max(40).optional().or(z.literal("")),
  consentToProcess: z.boolean().default(true),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    optionId: z.string().uuid().optional().or(z.literal("")),
    textAnswer: z.string().trim().max(1500).optional().or(z.literal("")),
    numericAnswer: z.coerce.number().min(0).max(10).optional(),
  })).min(1).max(30),
});

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function stripAreaSuffix(value: string, suffix: "County" | "Constituency" | "Ward") {
  const escaped = suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return value.replace(new RegExp(`\\s+${escaped}$`, "i"), "").trim();
}

function officialCountyName(value: string) {
  return value.toLowerCase() === "nairobi" ? "Nairobi City" : value;
}

function displayCountyName(value: string) {
  return value.toLowerCase() === "nairobi city" ? "Nairobi" : value;
}

function scopeLabel(campaign: Record<string, unknown> | null | undefined) {
  const position = clean(campaign?.position_targeted);
  const lower = position.toLowerCase();
  const county = displayCountyName(stripAreaSuffix(clean(campaign?.county), "County"));
  const constituency = stripAreaSuffix(clean(campaign?.constituency), "Constituency");
  const ward = stripAreaSuffix(clean(campaign?.ward), "Ward");
  if (lower.includes("president") || lower.includes("referendum")) return "Kenya";
  if (["governor", "senator", "women representative", "woman representative", "women rep", "woman rep"].some((term) => lower.includes(term))) return county ? `${county} County` : "the county";
  if (lower.includes("mca")) return ward ? `${ward} Ward` : "the ward";
  return constituency ? `${constituency} Constituency` : "the constituency";
}

function pollDescription(poll: Record<string, unknown>, campaign: Record<string, unknown> | null | undefined) {
  const description = clean(poll.description);
  if (description && !description.toLowerCase().startsWith("quick campaign pulse for ")) return description;
  const rawPosition = clean(campaign?.position_targeted) || "candidate";
  const position = rawPosition.toLowerCase() === "candidate" ? "" : `${rawPosition} `;
  const scope = scopeLabel(campaign);
  const candidate = clean(campaign?.candidate_name) || "the candidate";
  return `${candidate}'s ${position}campaign is collecting voter priorities in ${scope}. Choose your area so the team can see the strongest issues by constituency, ward, and polling station.`;
}

async function locationOptions(tenantId: string, campaign: Record<string, unknown> | null | undefined) {
  const supabase = getLooseSupabaseAdmin();
  const county = displayCountyName(stripAreaSuffix(clean(campaign?.county), "County"));
  const officialCounty = officialCountyName(county);
  const constituency = stripAreaSuffix(clean(campaign?.constituency), "Constituency");
  const ward = stripAreaSuffix(clean(campaign?.ward), "Ward");
  const [{ data: counties }, { data: constituencies }, { data: wards }, { data: villages }, { data: stations }] = await Promise.all([
    supabase.from("counties").select("id, name").eq("tenant_id", tenantId).limit(500),
    supabase.from("constituencies").select("id, name, county_id").eq("tenant_id", tenantId).limit(1000),
    supabase.from("wards").select("id, name, constituency_id").eq("tenant_id", tenantId).limit(3000),
    supabase.from("villages").select("id, name, ward_id").eq("tenant_id", tenantId).limit(5000),
    supabase.from("polling_stations").select("id, name, village_id, registered_voters").eq("tenant_id", tenantId).limit(50000),
  ]);
  const countyRows = Array.isArray(counties) ? counties : [];
  const constituencyRows = Array.isArray(constituencies) ? constituencies : [];
  const wardRows = Array.isArray(wards) ? wards : [];
  const villageRows = Array.isArray(villages) ? villages : [];
  const stationRows = Array.isArray(stations) ? stations : [];
  const countyById = new Map(countyRows.map((row) => [String(row.id), clean(row.name)]));
  const constituencyById = new Map(constituencyRows.map((row) => [String(row.id), row]));
  const wardById = new Map(wardRows.map((row) => [String(row.id), row]));
  const villageById = new Map(villageRows.map((row) => [String(row.id), row]));
  const stationOptions = stationRows.map((station) => {
    const villageRow = villageById.get(String(station.village_id));
    const wardRow = wardById.get(String(villageRow?.ward_id));
    const constituencyRow = constituencyById.get(String(wardRow?.constituency_id));
    return {
      id: String(station.id),
      name: clean(station.name),
      registeredVoters: Number(station.registered_voters ?? 0),
      ward: clean(wardRow?.name),
      constituency: clean(constituencyRow?.name),
      county: countyById.get(String(constituencyRow?.county_id)) ?? "",
    };
  }).filter((station) => station.name);
  const officialConstituencies = county ? constituenciesForCounty(officialCounty) : [];
  const constituencyNames = [...new Set([
    ...constituencyRows.map((row) => clean(row.name)).filter(Boolean),
    ...officialConstituencies,
  ])].filter((name) => !county || stationOptions.some((station) => station.constituency === name) || officialConstituencies.includes(name)).sort((a, b) => a.localeCompare(b));
  const dbWardEntries = wardRows.map((row) => {
    const constituencyRow = constituencyById.get(String(row.constituency_id));
    return {
      constituency: clean(constituencyRow?.name),
      ward: clean(row.name),
    };
  }).filter((row) => row.ward);
  const officialWardEntries = constituency
    ? wardsForConstituency(constituency).map((name) => ({ constituency, ward: name }))
    : county
      ? wardsForCounty(officialCounty).map((row) => ({ constituency: row.constituency, ward: row.ward }))
      : [];
  const wardEntries = [...dbWardEntries, ...officialWardEntries].reduce<Array<{ constituency: string; ward: string }>>((rows, row) => {
    if (!rows.some((item) => item.constituency === row.constituency && item.ward === row.ward)) rows.push(row);
    return rows;
  }, []).sort((a, b) => a.constituency.localeCompare(b.constituency) || a.ward.localeCompare(b.ward));
  const wardNames = [...new Set(wardEntries.map((row) => row.ward))].sort((a, b) => a.localeCompare(b));
  return {
    county,
    constituency,
    ward,
    constituencies: constituencyNames,
    wards: wardNames,
    wardEntries,
    pollingStations: stationOptions,
  };
}

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return digits.length <= 6 ? `${digits.slice(0, 2)}***` : `${digits.slice(0, 4)}***${digits.slice(-2)}`;
}

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

  const [{ data: questions }, { data: options }, { data: campaignSettings }, { data: candidate }] = await Promise.all([
    supabase.from("poll_questions").select("id, question_text, question_type, required, display_order").eq("poll_id", pollId).eq("tenant_id", poll.tenant_id).order("display_order", { ascending: true }),
    supabase.from("poll_options").select("id, question_id, option_text, display_order").eq("tenant_id", poll.tenant_id).order("display_order", { ascending: true }),
    supabase.from("campaign_settings").select("candidate_name, campaign_name, position_targeted, county, constituency, ward, slogan").eq("tenant_id", poll.tenant_id).limit(1).maybeSingle(),
    supabase.from("candidates").select("full_name, campaign_name, position_contesting, county, constituency, ward, slogan").eq("tenant_id", poll.tenant_id).limit(1).maybeSingle(),
  ]);
  const campaign = campaignSettings ?? (candidate ? {
    candidate_name: candidate.full_name,
    campaign_name: candidate.campaign_name,
    position_targeted: candidate.position_contesting,
    county: candidate.county,
    constituency: candidate.constituency,
    ward: candidate.ward,
    slogan: candidate.slogan,
  } : null);

  const questionRows = (Array.isArray(questions) ? questions : []) as PublicQuestionRow[];
  const optionRows = (Array.isArray(options) ? options : []) as PublicOptionRow[];
  const questionIds = new Set(questionRows.map((question) => question.id));
  const locations = await locationOptions(String(poll.tenant_id), campaign ?? null);
  return NextResponse.json({
    poll: {
      id: poll.id,
      title: poll.title,
      description: pollDescription(poll, campaign ?? null),
      pollType: poll.poll_type,
      requireConsent: poll.require_consent,
      collectLocation: poll.collect_location,
      collectDemographics: poll.collect_demographics,
      methodologyNote: poll.methodology_note,
    },
    campaign,
    questions: questionRows,
    options: optionRows.filter((option) => questionIds.has(option.question_id)),
    locations,
  }, { headers: { "Cache-Control": "no-store" } });
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

  const [{ data: questions }, { data: options }] = await Promise.all([
    supabase.from("poll_questions").select("id, question_type, required").eq("poll_id", poll.id).eq("tenant_id", poll.tenant_id),
    supabase.from("poll_options").select("id, question_id").eq("tenant_id", poll.tenant_id),
  ]);
  const questionRows = Array.isArray(questions) ? questions : [];
  const questionIds = new Set(questionRows.map((question) => String(question.id)));
  const optionQuestion = new Map((Array.isArray(options) ? options : []).map((option) => [String(option.id), String(option.question_id)]));
  for (const answer of parsed.data.answers) {
    if (!questionIds.has(answer.questionId)) return NextResponse.json({ error: "Poll answer does not match this poll." }, { status: 400 });
    if (answer.optionId && optionQuestion.get(answer.optionId) !== answer.questionId) {
      return NextResponse.json({ error: "Poll answer option does not match this question." }, { status: 400 });
    }
  }
  const answeredIds = new Set(parsed.data.answers.filter((answer) => answer.optionId || answer.textAnswer || (typeof answer.numericAnswer === "number" && answer.numericAnswer > 0)).map((answer) => answer.questionId));
  const missingRequired = questionRows.some((question) => question.required && !answeredIds.has(String(question.id)));
  if (missingRequired) return NextResponse.json({ error: "Please answer all required poll questions." }, { status: 400 });

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
      phone_number: parsed.data.phoneNumber ? maskPhone(parsed.data.phoneNumber) : null,
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
