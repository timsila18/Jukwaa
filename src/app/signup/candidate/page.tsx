"use client";

import Link from "next/link";
import { useState } from "react";
import { UserCog } from "lucide-react";
import { candidatePositionScopes, partyAffiliationOptions } from "@/lib/demo-data";
import { constituenciesForCounty, kenyaCounties, wardsForConstituency } from "@/lib/kenya-geography";

const positionValues: Record<string, string> = {
  president: "Presidential",
  governor: "Governor",
  senator: "Senator",
  "woman-representative": "Women Representative",
  mp: "MP",
  mca: "MCA",
};

const positionGeography: Record<string, { county: boolean; constituency: boolean; ward: boolean; helper: string }> = {
  Presidential: { county: false, constituency: false, ward: false, helper: "National campaign: no county, constituency, or ward is required." },
  Governor: { county: true, constituency: false, ward: false, helper: "County-level campaign: choose the county only." },
  Senator: { county: true, constituency: false, ward: false, helper: "County-level campaign: choose the county only." },
  "Women Representative": { county: true, constituency: false, ward: false, helper: "County-level campaign: choose the county only." },
  MP: { county: true, constituency: true, ward: false, helper: "Constituency-level campaign: choose county and constituency. Ward is not needed." },
  MCA: { county: true, constituency: true, ward: true, helper: "Ward-level campaign: choose county, constituency, and ward." },
  "Party Election": { county: true, constituency: true, ward: true, helper: "Choose the geography that applies to the party election." },
  Referendum: { county: false, constituency: false, ward: false, helper: "National issue campaign: no electoral geography is required." },
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
    password: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const geography = positionGeography[form.position] ?? positionGeography.MP;
  const constituencies = constituenciesForCounty(form.county);
  const wards = wardsForConstituency(form.constituency);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "position") {
        const scope = positionGeography[value] ?? positionGeography.MP;
        if (!scope.county) next.county = "";
        if (!scope.constituency) next.constituency = "";
        if (!scope.ward) next.ward = "";
      }
      if (key === "county") {
        next.constituency = "";
        next.ward = "";
      }
      if (key === "constituency") next.ward = "";
      return next;
    });
  }

  async function submitCandidate() {
    setStatus("");
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (geography.county && !form.county.trim()) {
      setError("County is required for this position.");
      return;
    }
    if (geography.constituency && !form.constituency.trim()) {
      setError("Constituency is required for this position.");
      return;
    }
    if (geography.ward && !form.ward.trim()) {
      setError("Ward is required for this position.");
      return;
    }
    setIsSubmitting(true);
    setStatus("Creating candidate workspace...");
    try {
      const response = await fetch("/api/onboarding/candidate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus("");
        setError(payload.error ?? "Could not create candidate workspace. Try again or contact support.");
        return;
      }
      setStatus(`Workspace created. Redirecting to payment for account ${payload.accountReference}.`);
      window.location.assign(payload.redirectTo || "/payment/confirm");
    } catch {
      setStatus("");
      setError("Candidate signup could not be completed. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="j-auth-page min-h-screen px-4 py-8 text-slate-900">
      <section className="j-auth-card mx-auto rounded-lg p-6" style={{ width: "min(64rem, calc(100vw - 2rem))" }}>
        <Link className="text-sm font-bold text-sky-700" href="/">Back to dashboard</Link>
        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 text-white shadow-sm">
              <UserCog size={20} />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-950">Create Candidate Workspace</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Register a candidate, choose party or independent status, select seat level, then activate the workspace after payment verification.</p>
          </div>
          <Link className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50" href="/login">Already registered? Login</Link>
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
          <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm leading-6 text-sky-900 md:col-span-2">{geography.helper}</div>
          {geography.county ? <label className="block text-sm font-semibold text-slate-700">County<select className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("county", event.target.value)} required value={form.county}><option value="">Select county</option>{kenyaCounties.map((county) => <option key={county}>{county}</option>)}</select></label> : null}
          {geography.constituency ? <label className="block text-sm font-semibold text-slate-700">Constituency<select className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500 disabled:bg-slate-100" disabled={!form.county || constituencies.length === 0} onChange={(event) => update("constituency", event.target.value)} required value={form.constituency}><option value="">{form.county && constituencies.length === 0 ? "Constituencies being added for this county" : "Select constituency"}</option>{constituencies.map((constituency) => <option key={constituency}>{constituency}</option>)}</select></label> : null}
          {geography.ward ? <label className="block text-sm font-semibold text-slate-700">Ward<select className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500 disabled:bg-slate-100" disabled={!form.constituency || wards.length === 0} onChange={(event) => update("ward", event.target.value)} required value={form.ward}><option value="">{form.constituency && wards.length === 0 ? "Wards being added for this constituency" : "Select ward"}</option>{wards.map((ward) => <option key={ward}>{ward}</option>)}</select></label> : null}
          <label className="block text-sm font-semibold text-slate-700">Campaign name<input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("campaignName", event.target.value)} value={form.campaignName} /></label>
          <label className="block text-sm font-semibold text-slate-700">Campaign slogan<input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("slogan", event.target.value)} value={form.slogan} /></label>
          <label className="block text-sm font-semibold text-slate-700">
            Plan
            <select className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("plan", event.target.value)} value={form.plan}>
              {["Starter", "Professional", "Advanced", "Enterprise"].map((plan) => <option key={plan}>{plan}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">Create password<input autoComplete="new-password" className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("password", event.target.value)} type="password" value={form.password} /></label>
          <label className="block text-sm font-semibold text-slate-700">Confirm password<input autoComplete="new-password" className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("confirmPassword", event.target.value)} type="password" value={form.confirmPassword} /></label>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 md:col-span-2">
            Payment activation: after registration, the candidate pays via the configured M-Pesa Paybill. Admin verifies payment and activates the workspace.
          </div>
          <button className="h-11 rounded-md bg-slate-950 px-4 text-sm font-bold text-white shadow-sm hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400 md:col-span-2" disabled={isSubmitting} type="submit">{isSubmitting ? "Creating workspace..." : "Create Candidate Workspace"}</button>
        </form>
        {status ? <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{status}</div> : null}
        {error ? <div className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
      </section>
    </main>
  );
}
