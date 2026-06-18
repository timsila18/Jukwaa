import Link from "next/link";
import { UserCog } from "lucide-react";
import { candidatePositionScopes, partyAffiliationOptions } from "@/lib/demo-data";

export default function CandidateSignupPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <section className="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Link className="text-sm font-bold text-teal-700" href="/">Back to dashboard</Link>
        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-teal-50 text-teal-700">
              <UserCog size={20} />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-950">Create Candidate Workspace</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Register a candidate, choose party or independent status, select seat level, then activate the workspace after payment verification.</p>
          </div>
          <Link className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50" href="/login">Already registered? Login</Link>
        </div>
        <form className="mt-6 grid gap-4 md:grid-cols-2">
          {["Candidate full name", "Phone number", "Email address", "National ID / Passport"].map((label) => (
            <label className="block text-sm font-semibold text-slate-700" key={label}>
              {label}
              <input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-500" />
            </label>
          ))}
          <label className="block text-sm font-semibold text-slate-700">
            Position
            <select className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-500">
              {candidatePositionScopes.map((scope) => <option key={scope.id}>{scope.displayName}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Party affiliation
            <select className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-500">
              {partyAffiliationOptions.map((option) => <option key={option.id}>{option.displayName}</option>)}
            </select>
          </label>
          {["County", "Constituency", "Ward", "Campaign slogan"].map((label) => (
            <label className="block text-sm font-semibold text-slate-700" key={label}>
              {label}
              <input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-500" />
            </label>
          ))}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 md:col-span-2">
            Payment activation: after registration, the candidate pays via the configured M-Pesa Paybill. Admin verifies payment and activates the workspace.
          </div>
          <button className="h-11 rounded-md bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800 md:col-span-2" type="button">Create Candidate Workspace</button>
        </form>
      </section>
    </main>
  );
}
