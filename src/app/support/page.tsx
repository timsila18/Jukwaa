import Link from "next/link";

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Link className="text-sm font-bold text-sky-700" href="/">Back to dashboard</Link>
        <h1 className="mt-6 text-3xl font-bold text-slate-950">JUKWAA Support</h1>
        <div className="mt-5 grid gap-3 text-sm text-slate-700">
          <div className="rounded-md bg-slate-50 p-3"><b>WhatsApp:</b> CONFIGURE_SUPPORT_WHATSAPP</div>
          <div className="rounded-md bg-slate-50 p-3"><b>Email:</b> support@jukwaakenya.co.ke</div>
          <div className="rounded-md bg-slate-50 p-3"><b>Candidate onboarding:</b> CONFIGURE_SUPPORT_PHONE</div>
        </div>
      </section>
    </main>
  );
}
