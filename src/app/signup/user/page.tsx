"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, KeyRound, LockKeyhole, UserCheck } from "lucide-react";
import { roles } from "@/lib/demo-data";

export default function UserSignupPage() {
  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    joinCode: "",
    role: "Volunteer",
    geography: "",
  });
  const [joinForm, setJoinForm] = useState(() => ({
    joinCode: typeof window === "undefined" ? "" : (new URLSearchParams(window.location.search).get("code") ?? "").toUpperCase(),
    login: "",
    password: "",
    confirmPassword: "",
  }));
  const [inviteCode, setInviteCode] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [status, setStatus] = useState("");
  const [joinStatus, setJoinStatus] = useState("");
  const [error, setError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateJoin(key: keyof typeof joinForm, value: string) {
    setJoinForm((current) => ({ ...current, [key]: value }));
  }

  async function createInvitation() {
    setStatus("");
    setError("");
    setIsInviting(true);
    setStatus("Creating invitation...");
    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus("");
        setError(payload.error ?? "Could not create invitation. Login as a campaign admin and try again.");
        return;
      }
      setInviteCode(payload.invitationCode);
      setJoinUrl(`${window.location.origin}${payload.joinUrl}`);
      setStatus(`Invitation created. Give this joining code to ${form.fullName}.`);
    } catch {
      setStatus("");
      setError("Invitation could not be created. Check your connection and try again.");
    } finally {
      setIsInviting(false);
    }
  }

  async function joinWorkspace() {
    setJoinStatus("");
    setJoinError("");
    if (joinForm.password !== joinForm.confirmPassword) {
      setJoinError("Passwords do not match.");
      return;
    }
    setIsJoining(true);
    setJoinStatus("Creating your password...");
    try {
      const response = await fetch("/api/auth/join", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          joinCode: joinForm.joinCode,
          login: joinForm.login,
          password: joinForm.password,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setJoinStatus("");
        setJoinError(payload.error ?? "Could not join workspace.");
        return;
      }
      setJoinStatus(`Password created. Opening your dashboard...`);
      window.location.assign(payload.redirectTo || "/");
    } catch {
      setJoinStatus("");
      setJoinError("Could not join workspace. Check your connection and try again.");
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <section className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Link className="text-sm font-bold text-sky-700" href="/">Back to dashboard</Link>
        <div className="mt-6">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-sky-50 text-sky-700">
            <UserCheck size={20} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-950">Create or Invite Campaign User</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Generate a one-time joining code and give it to the user. They create their password once and login normally after that.</p>
        </div>
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void createInvitation(); }}>
          <label className="block text-sm font-semibold text-slate-700">Full name<input autoComplete="name" className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("fullName", event.target.value)} value={form.fullName} /></label>
          <label className="block text-sm font-semibold text-slate-700">Phone number<input autoComplete="tel" className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("phoneNumber", event.target.value)} value={form.phoneNumber} /></label>
          <label className="block text-sm font-semibold text-slate-700">Email address<input autoComplete="email" className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("email", event.target.value)} value={form.email} /></label>
          <label className="block text-sm font-semibold text-slate-700">
            Role
            <select className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("role", event.target.value)} value={form.role}>
              {roles.map((role) => <option key={role}>{role}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Geography assignment
            <input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => update("geography", event.target.value)} placeholder="All campaign, constituency, ward, village, station" value={form.geography} />
          </label>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400 md:col-span-2" disabled={isInviting} type="submit">
            <KeyRound size={16} />
            {isInviting ? "Creating invitation..." : "Create User Invitation"}
          </button>
        </form>
        {status ? <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{status}</div> : null}
        {inviteCode ? (
          <div className="mt-4 rounded-md border border-sky-100 bg-sky-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-sky-800">Joining code</div>
            <div className="mt-2 text-2xl font-black text-slate-950">{inviteCode}</div>
            <div className="mt-2 break-all text-sm font-semibold text-slate-700">{joinUrl}</div>
            <button className="mt-3 inline-flex h-10 items-center gap-2 rounded-md bg-white px-3 text-sm font-bold text-sky-800 ring-1 ring-sky-200 hover:bg-sky-100" onClick={() => void navigator.clipboard.writeText(`${inviteCode}\n${joinUrl}`)} type="button">
              <Copy size={15} />
              Copy code
            </button>
          </div>
        ) : null}
        {error ? <div className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100 text-slate-800">
          <LockKeyhole size={20} />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-950">Join With Code</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Use the joining code once to create your password. After that, login with your phone or email and password.</p>
        <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); void joinWorkspace(); }}>
          <label className="block text-sm font-semibold text-slate-700">
            Joining code
            <input autoComplete="one-time-code" className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm uppercase outline-none focus:border-sky-500" onChange={(event) => updateJoin("joinCode", event.target.value.toUpperCase())} placeholder="JUK-ABC123" value={joinForm.joinCode} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Phone or email from invitation
            <input autoComplete="username" className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => updateJoin("login", event.target.value)} placeholder="+254700111222 or user@example.com" value={joinForm.login} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Create password
            <input autoComplete="new-password" className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => updateJoin("password", event.target.value)} placeholder="At least 8 characters" type="password" value={joinForm.password} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Confirm password
            <input autoComplete="new-password" className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => updateJoin("confirmPassword", event.target.value)} placeholder="Repeat password" type="password" value={joinForm.confirmPassword} />
          </label>
          <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400" disabled={isJoining} type="submit">
            <KeyRound size={16} />
            {isJoining ? "Creating password..." : "Create Password"}
          </button>
        </form>
        {joinStatus ? <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{joinStatus}</div> : null}
        {joinError ? <div className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{joinError}</div> : null}
        <Link className="mt-4 block rounded-md bg-slate-50 p-3 text-sm font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-800" href="/login">Go to login</Link>
      </div>
      </section>
    </main>
  );
}
