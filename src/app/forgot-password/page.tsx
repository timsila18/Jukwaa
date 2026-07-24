"use client";

import Link from "next/link";
import { useState } from "react";
import { KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [login, setLogin] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setStatus("");
    setError("");
    const response = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Could not create reset code.");
      return;
    }
    setStatus(payload.status ?? "If that account exists, a reset request has been recorded. Use a reset code from your campaign admin, or your still-valid joining code.");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10 text-slate-900">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Link className="text-sm font-bold text-sky-700" href="/login">Back to login</Link>
        <div className="mt-6 grid h-11 w-11 place-items-center rounded-lg bg-sky-50 text-sky-700"><KeyRound size={20} /></div>
        <h1 className="mt-4 text-2xl font-bold text-slate-950">Forgot Password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">No email confirmation is needed. Enter your phone or email, then use a reset code from your campaign admin or your still-valid joining code to create a new password.</p>
        <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
          <label className="block text-sm font-semibold text-slate-700">Phone or email<input autoComplete="username" className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => setLogin(event.target.value)} value={login} /></label>
          <button className="h-11 w-full rounded-md bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-900" type="submit">Request Reset</button>
        </form>
        {status ? <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{status}</div> : null}
        {error ? <div className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
        <Link className="mt-4 block rounded-md bg-slate-50 p-3 text-sm font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-800" href="/reset-password">I have a reset code</Link>
      </section>
    </main>
  );
}
