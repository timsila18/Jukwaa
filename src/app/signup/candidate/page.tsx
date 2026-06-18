"use client";

import Link from "next/link";
import { useState } from "react";
import { UserCog } from "lucide-react";
import { candidatePositionScopes, partyAffiliationOptions } from "@/lib/demo-data";

const positionValues: Record<string, string> = {
  president: "Presidential",
  governor: "Governor",
  senator: "Senator",
  "woman-representative": "Women Representative",
  mp: "MP",
  mca: "MCA",
};

export default function CandidateSignupPage() {
  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    nationalId: "",
    position: "MP",
    politicalParty: "Independent Candidate",
    county: "",
    constituency: "",
    ward: "",
    campaignName: "",
    slogan: "",
    plan: "Professional",
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitCandidate() {
    setStatus("");
    setError("");
    const response = await fetch("/api/onboarding/candidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Could not create candidate workspace.");
      return;
    }
    setStatus(`Workspace created in payment-pending state. Pay KES ${payload.amountDueKes.toLocaleString()} to Paybill ${payload.paybillNumber}, account ${payload.accountReference}.`);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <section className="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Link className="text-sm font-bold text-sky-700" href="/">Back to dashboard</Link>
        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-sky-50 text-sky-700">
              <UserCog size={20} />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-950">Create Candidate Workspace</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Register a candidate, choose party or independent status, select seat level, then activate the workspace after payment verification.</p>
          </div>
          <Link className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50" href="/login">Already registered? Login</Link>
        </div>
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void submitCandidate(); }}>
          <label className="block text-sm font-semibold text-slate-700">Candidate full name<input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("fullName", event.target.value)} value={form.fullName} /></label>
          <label className="block text-sm font-semibold text-slate-700">Phone number<input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("phoneNumber", event.target.value)} value={form.phoneNumber} /></label>
          <label className="block text-sm font-semibold text-slate-700">Email address<input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("email", event.target.value)} value={form.email} /></label>
          <label className="block text-sm font-semibold text-slate-700">National ID / Passport<input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("nationalId", event.target.value)} value={form.nationalId} /></label>
          <label className="block text-sm font-semibold text-slate-700">
            Position
            <select className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("position", event.target.value)} value={form.position}>
              {candidatePositionScopes.map((scope) => <option key={scope.id} value={positionValues[scope.id] ?? scope.displayName}>{scope.displayName}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Party affiliation
            <select className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("politicalParty", event.target.value)} value={form.politicalParty}>
              {partyAffiliationOptions.map((option) => <option key={option.id} value={option.displayName}>{option.displayName}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">County<input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("county", event.target.value)} value={form.county} /></label>
          <label className="block text-sm font-semibold text-slate-700">Constituency<input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("constituency", event.target.value)} value={form.constituency} /></label>
          <label className="block text-sm font-semibold text-slate-700">Ward<input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("ward", event.target.value)} value={form.ward} /></label>
          <label className="block text-sm font-semibold text-slate-700">Campaign name<input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("campaignName", event.target.value)} value={form.campaignName} /></label>
          <label className="block text-sm font-semibold text-slate-700">Campaign slogan<input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("slogan", event.target.value)} value={form.slogan} /></label>
          <label className="block text-sm font-semibold text-slate-700">
            Plan
            <select className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("plan", event.target.value)} value={form.plan}>
              {["Starter", "Professional", "Advanced", "Enterprise"].map((plan) => <option key={plan}>{plan}</option>)}
            </select>
          </label>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 md:col-span-2">
            Payment activation: after registration, the candidate pays via the configured M-Pesa Paybill. Admin verifies payment and activates the workspace.
          </div>
          <button className="h-11 rounded-md bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-900 md:col-span-2" type="submit">Create Candidate Workspace</button>
        </form>
        {status ? <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{status}</div> : null}
        {error ? <div className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
      </section>
    </main>
  );
}
