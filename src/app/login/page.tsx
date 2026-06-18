"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Smartphone } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function submitLogin() {
    setStatus("");
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Login failed.");
      return;
    }
    setStatus(`Logged in as ${payload.user?.email ?? login}.`);
    router.push(new URLSearchParams(window.location.search).get("next") || payload.redirectTo || "/");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10 text-slate-900">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Link className="text-sm font-bold text-sky-700" href="/">Back to dashboard</Link>
        <div className="mt-6">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-sky-50 text-sky-700">
            <KeyRound size={20} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-950">Login to JUKWAA</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Candidates and invited campaign users can sign in with phone or email.</p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); void submitLogin(); }}>
          <label className="block text-sm font-semibold text-slate-700">
            Phone or email
            <input autoComplete="username" className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => setLogin(event.target.value)} placeholder="+254700111222 or candidate@jukwaa.app" value={login} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Password
            <input autoComplete="current-password" className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" type="password" value={password} />
          </label>
          <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-900" type="submit">
            <Smartphone size={16} />
            Continue
          </button>
        </form>
        {status ? <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{status}</div> : null}
        {error ? <div className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
        <div className="mt-5 grid gap-2 text-sm">
          <Link className="rounded-md bg-slate-50 p-3 font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-800" href="/signup/candidate">Create candidate workspace</Link>
          <Link className="rounded-md bg-slate-50 p-3 font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-800" href="/signup/user">Join as invited campaign user</Link>
          <Link className="rounded-md bg-slate-50 p-3 font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-800" href="/forgot-password">Forgot password</Link>
        </div>
      </section>
    </main>
  );
}
