"use client";

import Link from "next/link";
import { useState } from "react";
import { Smartphone } from "lucide-react";

export default function PaymentConfirmPage() {
  const [form, setForm] = useState({ applicationId: "", accountReference: "", phoneNumber: "", amountKes: "", mpesaReceiptNumber: "", channel: "Manual Paybill" });
  const [status, setStatus] = useState("");
  const [stkStatus, setStkStatus] = useState("");
  const [error, setError] = useState("");

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitPayment() {
    setStatus("");
    setError("");
    const response = await fetch("/api/onboarding/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amountKes: Number(form.amountKes) }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Payment could not be recorded.");
      return;
    }
    setStatus(`Payment confirmation submitted. Status: ${payload.status}.`);
  }

  async function requestStkPush() {
    setStkStatus("");
    setError("");
    const response = await fetch("/api/payments/mpesa/stk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId: form.applicationId || undefined,
        accountReference: form.accountReference,
        phoneNumber: form.phoneNumber,
        amountKes: Number(form.amountKes),
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Could not send STK Push.");
      return;
    }
    setStkStatus(payload.customerMessage ?? "STK Push sent. Check the phone and enter M-Pesa PIN.");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-8 text-slate-900">
      <section className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Link className="text-sm font-bold text-sky-700" href="/">Back to dashboard</Link>
        <div className="mt-6">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-sky-50 text-sky-700"><Smartphone size={20} /></div>
          <h1 className="mt-4 text-2xl font-bold text-slate-950">Confirm Candidate Payment</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Submit Paybill or STK payment details so the workspace can be verified and activated.</p>
        </div>
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void submitPayment(); }}>
          <label className="block text-sm font-semibold text-slate-700">Application ID<input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("applicationId", event.target.value)} value={form.applicationId} /></label>
          <label className="block text-sm font-semibold text-slate-700">Account reference<input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("accountReference", event.target.value)} value={form.accountReference} /></label>
          <label className="block text-sm font-semibold text-slate-700">Phone number<input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("phoneNumber", event.target.value)} value={form.phoneNumber} /></label>
          <label className="block text-sm font-semibold text-slate-700">Amount KES<input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("amountKes", event.target.value)} value={form.amountKes} /></label>
          <label className="block text-sm font-semibold text-slate-700">M-Pesa receipt<input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("mpesaReceiptNumber", event.target.value)} value={form.mpesaReceiptNumber} /></label>
          <label className="block text-sm font-semibold text-slate-700">Channel<select className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("channel", event.target.value)} value={form.channel}>{["Manual Paybill", "STK Push", "Bank Transfer"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
            <button className="h-11 rounded-md bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-900" type="button" onClick={() => void requestStkPush()}>Send STK Push</button>
            <button className="h-11 rounded-md bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800" type="submit">Submit Manual Confirmation</button>
          </div>
        </form>
        {stkStatus ? <div className="mt-4 rounded-md bg-sky-50 p-3 text-sm font-semibold text-sky-800">{stkStatus}</div> : null}
        {status ? <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{status}</div> : null}
        {error ? <div className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
      </section>
    </main>
  );
}
