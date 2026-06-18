import Link from "next/link";

const docs = [
  ["Privacy Policy", "JUKWAA stores campaign, candidate, supporter, volunteer, payment, and communication data for authorized campaign operations."],
  ["Terms of Service", "Candidates are responsible for lawful campaign use, truthful records, authorized team access, and subscription payment."],
  ["Data Consent", "Campaign teams must collect consent before contacting supporters, volunteers, agents, or community members."],
  ["Candidate Data Ownership", "Candidate workspaces remain tenant-isolated. Data export is available through reports and admin support."],
  ["Backup Policy", "Workspace data should be backed up through Supabase backups and CSV/XLSX/PDF exports."],
];

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <section className="mx-auto max-w-4xl">
        <Link className="text-sm font-bold text-teal-700" href="/">Back to dashboard</Link>
        <h1 className="mt-6 text-3xl font-bold text-slate-950">Legal and Data Policies</h1>
        <div className="mt-6 grid gap-4">
          {docs.map(([title, body]) => (
            <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={title}>
              <h2 className="text-lg font-bold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
