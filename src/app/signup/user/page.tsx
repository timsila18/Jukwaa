import Link from "next/link";
import { KeyRound, UserCheck } from "lucide-react";
import { roles } from "@/lib/demo-data";

export default function UserSignupPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Link className="text-sm font-bold text-teal-700" href="/">Back to dashboard</Link>
        <div className="mt-6">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-teal-50 text-teal-700">
            <UserCheck size={20} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-950">Create or Invite Campaign User</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Campaign users join through invite links, phone invites, email invites, or join codes controlled by the candidate workspace.</p>
        </div>
        <form className="mt-6 grid gap-4 md:grid-cols-2">
          {["Full name", "Phone number", "Email address", "Join code"].map((label) => (
            <label className="block text-sm font-semibold text-slate-700" key={label}>
              {label}
              <input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-500" />
            </label>
          ))}
          <label className="block text-sm font-semibold text-slate-700">
            Role
            <select className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-500">
              {roles.map((role) => <option key={role}>{role}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Geography assignment
            <input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-500" placeholder="All campaign, constituency, ward, village, station" />
          </label>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800 md:col-span-2" type="button">
            <KeyRound size={16} />
            Create User Invitation
          </button>
        </form>
      </section>
    </main>
  );
}
