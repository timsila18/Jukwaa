import Link from "next/link";

const plans = [
  ["Starter", "KES 15,000", "Local candidate launch, 10 users, 100 volunteers"],
  ["Professional", "KES 45,000", "Full campaign workspace, 50 users, 500 volunteers"],
  ["Advanced", "KES 85,000", "AI, field teams, agents, communications, advanced reporting"],
  ["Enterprise", "Custom", "Party, coalition, or multi-candidate deployment"],
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <section className="mx-auto max-w-5xl">
        <Link className="text-sm font-bold text-teal-700" href="/">Back to dashboard</Link>
        <h1 className="mt-6 text-3xl font-bold text-slate-950">JUKWAA Pricing</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map(([name, price, detail]) => (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={name}>
              <h2 className="text-lg font-bold text-slate-950">{name}</h2>
              <p className="mt-2 text-2xl font-bold text-teal-700">{price}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
