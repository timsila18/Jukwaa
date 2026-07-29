"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight, KeyRound, ShieldCheck, Smartphone } from "lucide-react";
import { ElectionCountdown } from "@/components/election-countdown";

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function nextPath() {
    const requested = new URLSearchParams(window.location.search).get("next") || "/";
    return requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";
  }

  async function submitLogin() {
    setStatus("");
    setError("");
    if (!login.trim() || !password) {
      setError("Enter your phone/email and password to continue.");
      return;
    }

    setIsSubmitting(true);
    setStatus("Checking your login...");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus("");
        setError(payload.error ?? "Login failed.");
        return;
      }
      setStatus("Login successful. Opening your dashboard...");
      window.location.assign(payload.redirectTo || nextPath());
    } catch {
      setStatus("");
      setError("Login could not be completed. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="j-auth-page min-h-screen px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[0.95fr_1fr]">
        <section className="j-auth-showcase hidden overflow-hidden rounded-lg p-7 text-white lg:block">
          <Image src="/jukwaa-logo.png" alt="JUKWAA Kenya" width={270} height={86} priority className="h-16 w-auto object-contain" />
          <div className="mt-12">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-200">Secure campaign access</p>
            <h1 className="mt-4 max-w-lg text-5xl font-black leading-tight text-white">One workspace for every serious campaign team.</h1>
            <p className="mt-5 max-w-md text-base font-semibold leading-7 text-slate-300">Sign in to manage supporters, teams, messages, polls, field work, and election readiness from one place.</p>
          </div>
          <div className="mt-10">
            <ElectionCountdown compact />
          </div>
          <div className="mt-8 grid gap-3">
            {["Role-aware dashboards", "Candidate-scoped data", "Audit-ready actions"].map((item) => (
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/7 p-3 text-sm font-black text-slate-100" key={item}>
                <ShieldCheck size={17} className="text-emerald-300" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="j-auth-card rounded-lg p-6 sm:p-7" style={{ width: "min(30rem, calc(100vw - 2rem))" }}>
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-sky-700" href="/landing">Back to home <ArrowRight size={14} /></Link>
        <div className="mt-6">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 text-white shadow-sm">
            <KeyRound size={20} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-950">Login to JUKWAA</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Candidates and invited team members can sign in with phone or email.</p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); void submitLogin(); }}>
          <label className="block text-sm font-semibold text-slate-700">
            Phone or email
            <input autoComplete="username" className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-sky-500" onChange={(event) => setLogin(event.target.value)} placeholder="+254700111222 or candidate@jukwaa.app" value={login} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Password
            <input autoComplete="current-password" className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-sky-500" onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" type="password" value={password} />
          </label>
          <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white shadow-sm hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400" disabled={isSubmitting} type="submit">
            <Smartphone size={16} />
            {isSubmitting ? "Signing in..." : "Continue"}
          </button>
        </form>
        {status ? <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{status}</div> : null}
        {error ? <div className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
        <div className="mt-5 grid gap-2 text-sm">
          <Link className="rounded-md border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800" href="/signup/candidate">Create candidate workspace</Link>
          <Link className="rounded-md border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800" href="/signup/user">Join as invited team member</Link>
          <Link className="rounded-md border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800" href="/forgot-password">Forgot password</Link>
        </div>
      </section>
      </div>
    </main>
  );
}
