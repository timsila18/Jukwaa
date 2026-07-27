"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";

type Question = {
  id: string;
  question_text: string;
  question_type: "single_choice" | "multiple_choice" | "text" | "rating" | "yes_no";
  required: boolean;
};

type Option = {
  id: string;
  question_id: string;
  option_text: string;
};

type PublicPollPayload = {
  poll: {
    id: string;
    title: string;
    description?: string | null;
    requireConsent: boolean;
    collectLocation: boolean;
    collectDemographics: boolean;
    methodologyNote?: string | null;
  };
  campaign?: {
    candidate_name?: string | null;
    campaign_name?: string | null;
    position_targeted?: string | null;
    county?: string | null;
    constituency?: string | null;
    slogan?: string | null;
  } | null;
  questions: Question[];
  options: Option[];
};

export default function PollResponseClient({ pollId }: { pollId: string }) {
  const [payload, setPayload] = useState<PublicPollPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [ward, setWard] = useState("");
  const [pollingStation, setPollingStation] = useState("");
  const [gender, setGender] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [consent, setConsent] = useState(true);
  const [status, setStatus] = useState("Loading poll...");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/public/polls/${pollId}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Poll could not be opened.");
        if (!cancelled) {
          setPayload(data);
          setStatus("");
        }
      })
      .catch((error) => !cancelled && setStatus(error instanceof Error ? error.message : "Poll could not be opened."));
    return () => { cancelled = true; };
  }, [pollId]);

  const optionsByQuestion = useMemo(() => {
    const map = new Map<string, Option[]>();
    for (const option of payload?.options ?? []) {
      map.set(option.question_id, [...(map.get(option.question_id) ?? []), option]);
    }
    return map;
  }, [payload?.options]);

  async function submit() {
    if (!payload) return;
    const responseAnswers = payload.questions.map((question) => ({
      questionId: question.id,
      optionId: question.question_type === "single_choice" ? answers[question.id] || "" : "",
      textAnswer: ["text", "yes_no"].includes(question.question_type) ? answers[question.id] || "" : "",
      numericAnswer: question.question_type === "rating" ? Number(answers[question.id] || 0) : undefined,
    }));
    if (payload.poll.requireConsent && !consent) {
      setStatus("Please accept consent before submitting.");
      return;
    }
    setStatus("Submitting...");
    const response = await fetch(`/api/public/polls/${pollId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        respondentName: name,
        phoneNumber: phone,
        wardName: ward,
        pollingStationName: pollingStation,
        gender,
        ageGroup,
        consentToProcess: consent,
        answers: responseAnswers,
      }),
    });
    const data = await response.json();
    setStatus(response.ok ? "Thank you. Your response has been submitted." : data.error || "Could not submit response.");
  }

  if (!payload) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-center text-white">
        <div>
          <Image src="/jukwaa-icon-192.png" alt="JUKWAA Kenya" width={96} height={96} className="mx-auto rounded-2xl" />
          <p className="mt-4 text-lg font-black">{status}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-8 text-slate-950">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 bg-slate-950 p-6 text-white">
          <Image src="/jukwaa-logo-sidebar.png" alt="JUKWAA" width={210} height={64} className="rounded-sm object-cover" />
          <p className="mt-6 text-xs font-black uppercase tracking-wide text-amber-300">Campaign Pulse</p>
          <h1 className="mt-2 text-3xl font-black">{payload.poll.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">{payload.poll.description || payload.campaign?.campaign_name || payload.campaign?.candidate_name}</p>
        </div>
        <div className="grid gap-4 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" value={name} onChange={(event) => setName(event.target.value)} placeholder="Name (optional)" />
            <input className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone (optional)" />
            <input className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" value={ward} onChange={(event) => setWard(event.target.value)} placeholder="Ward / area" />
            <input className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" value={pollingStation} onChange={(event) => setPollingStation(event.target.value)} placeholder="Polling station (optional)" />
          </div>
          {payload.poll.collectDemographics ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500" value={gender} onChange={(event) => setGender(event.target.value)}>
                <option value="">Gender (optional)</option>
                <option>Female</option>
                <option>Male</option>
                <option>Prefer not to say</option>
              </select>
              <select className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500" value={ageGroup} onChange={(event) => setAgeGroup(event.target.value)}>
                <option value="">Age group (optional)</option>
                <option>18-24</option>
                <option>25-34</option>
                <option>35-44</option>
                <option>45-59</option>
                <option>60+</option>
              </select>
            </div>
          ) : null}
          {payload.questions.map((question) => (
            <div key={question.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">{question.question_text}</p>
              {question.question_type === "text" ? (
                <textarea className="mt-3 min-h-28 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-sky-500" value={answers[question.id] || ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} />
              ) : question.question_type === "rating" ? (
                <input className="mt-3 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500" type="number" min={1} max={5} value={answers[question.id] || ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} placeholder="Rate 1 to 5" />
              ) : (
                <div className="mt-3 grid gap-2">
                  {(question.question_type === "yes_no" ? [{ id: "yes", option_text: "Yes" }, { id: "no", option_text: "No" }] : optionsByQuestion.get(question.id) ?? []).map((option) => (
                    <label key={option.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold hover:border-sky-200">
                      <input type="radio" name={question.id} value={option.id} checked={answers[question.id] === option.id} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} />
                      {option.option_text}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
          {payload.poll.requireConsent ? (
            <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
              I consent to JUKWAA processing this response for campaign analysis and follow-up.
            </label>
          ) : null}
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-900" onClick={() => void submit()} type="button">
            <Send size={16} />
            Submit Response
          </button>
          {status ? <p className="rounded-lg bg-slate-100 p-3 text-sm font-bold text-slate-700">{status}</p> : null}
          <p className="text-xs leading-5 text-slate-500">{payload.poll.methodologyNote || "This is a campaign pulse survey, not an official electoral poll. Responses guide field operations and message testing."}</p>
        </div>
      </section>
    </main>
  );
}
