"use client";

import Link from "next/link";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";

export default function ActivationPage() {
  const [applicationId, setApplicationId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function activate() {
    setStatus("");
    setError("");
    const response = await fetch("/api/admin/activate-workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, paymentId: paymentId || undefined }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Workspace activation failed.");
      return;
    }
    setStatus(`Workspace activated for candidate ${payload.candidateId}.`);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-8 text-slate-900">
      <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Link className="text-sm font-bold text-sky-700" href="/">Back to dashboard</Link>
        <div className="mt-6">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-sky-50 text-sky-700"><ShieldCheck size={20} /></div>
          <h1 className="mt-4 text-2xl font-bold text-slate-950">Activate Workspace</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">After manual payment verification, activate candidate workspace access, subscription, and owner account.</p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); void activate(); }}>
          <label className="block text-sm font-semibold text-slate-700">Application ID<input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => setApplicationId(event.target.value)} value={applicationId} /></label>
          <label className="block text-sm font-semibold text-slate-700">Payment ID<input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => setPaymentId(event.target.value)} value={paymentId} /></label>
          <button className="h-11 w-full rounded-md bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-900" type="submit">Activate Workspace</button>
        </form>
        {status ? <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{status}</div> : null}
        {error ? <div className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
      </section>
    </main>
  );
}
