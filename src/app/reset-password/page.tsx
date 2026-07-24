"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

export default function ResetPasswordPage() {
  const [form, setForm] = useState({ login: "", resetCode: "", password: "", confirmPassword: "" });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    setStatus("");
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const response = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Could not reset password.");
      return;
    }
    setStatus(payload.status ?? "Password updated. Opening your dashboard...");
    if (payload.redirectTo) window.location.assign(payload.redirectTo);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10 text-slate-900">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Link className="text-sm font-bold text-sky-700" href="/login">Back to login</Link>
        <div className="mt-6 grid h-11 w-11 place-items-center rounded-lg bg-slate-100 text-slate-800"><LockKeyhole size={20} /></div>
        <h1 className="mt-4 text-2xl font-bold text-slate-950">Reset Password</h1>
        <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
          <label className="block text-sm font-semibold text-slate-700">Phone or email<input autoComplete="username" className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("login", event.target.value)} value={form.login} /></label>
          <label className="block text-sm font-semibold text-slate-700">Reset code<input autoComplete="one-time-code" className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm uppercase outline-none focus:border-sky-500" onChange={(event) => update("resetCode", event.target.value.toUpperCase())} value={form.resetCode} /></label>
          <label className="block text-sm font-semibold text-slate-700">
            New password
            <span className="mt-1 flex h-11 w-full items-center rounded-md border border-slate-200 bg-white px-3 focus-within:border-sky-500">
              <input autoComplete="new-password" className="h-full min-w-0 flex-1 text-sm outline-none" onChange={(event) => update("password", event.target.value)} type={showPassword ? "text" : "password"} value={form.password} />
              <button aria-label={showPassword ? "Hide password" : "Show password"} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100" onClick={() => setShowPassword((current) => !current)} type="button">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Confirm password
            <input autoComplete="new-password" className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("confirmPassword", event.target.value)} type={showPassword ? "text" : "password"} value={form.confirmPassword} />
          </label>
          <button className="h-11 w-full rounded-md bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-900" type="submit">Reset Password</button>
        </form>
        {status ? <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{status}</div> : null}
        {error ? <div className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
      </section>
    </main>
  );
}
