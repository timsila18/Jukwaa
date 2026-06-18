import Link from "next/link";
import { KeyRound, Smartphone } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10 text-slate-900">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Link className="text-sm font-bold text-teal-700" href="/">Back to dashboard</Link>
        <div className="mt-6">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-teal-50 text-teal-700">
            <KeyRound size={20} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-950">Login to JUKWAA</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Candidates and invited campaign users can sign in with phone or email.</p>
        </div>
        <form className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Phone or email
            <input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-500" placeholder="+254700111222 or candidate@jukwaa.app" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Password
            <input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-500" placeholder="Enter password" type="password" />
          </label>
          <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800" type="button">
            <Smartphone size={16} />
            Continue
          </button>
        </form>
        <div className="mt-5 grid gap-2 text-sm">
          <Link className="rounded-md bg-slate-50 p-3 font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800" href="/signup/candidate">Create candidate workspace</Link>
          <Link className="rounded-md bg-slate-50 p-3 font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800" href="/signup/user">Join as invited campaign user</Link>
        </div>
      </section>
    </main>
  );
}
