import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ClipboardList,
  MapPinned,
  MessageSquare,
  ShieldCheck,
  UsersRound,
  Vote,
  type LucideIcon,
} from "lucide-react";
import { ElectionCountdown } from "@/components/election-countdown";

export const metadata: Metadata = {
  title: "JUKWAA Kenya Campaign Management Platform",
  description: "JUKWAA Kenya helps candidates manage supporters, volunteers, polling agents, events, polls, SMS outreach, reports, and campaign strategy from one secure command centre.",
  alternates: {
    canonical: "/",
  },
};

const features: Array<[string, string, LucideIcon, string]> = [
  ["Coverage Map", "County, constituency, ward, polling station, and local unit awareness for every race.", MapPinned, "cyan"],
  ["Field Teams", "Invite managers, volunteers, ward teams, agents, and assign work by campaign scope.", UsersRound, "blue"],
  ["Campaign Pulse", "Run polls, capture issues, and turn public feedback into practical reports.", ClipboardList, "gold"],
  ["Bulk Messaging", "Send SMS, prepare WhatsApp broadcasts, and coordinate supporters from one command desk.", MessageSquare, "emerald"],
  ["AI Strategy", "Generate speeches, briefs, issue summaries, and ward-level recommendations from live data.", Brain, "violet"],
  ["Security & Audit", "Workspace isolation, role permissions, admin approvals, and traceable campaign actions.", ShieldCheck, "slate"],
];

const steps = [
  ["01", "Create the workspace", "Choose candidate role, party or independent status, and campaign geography."],
  ["02", "Build the team", "Invite campaign managers, volunteers, agents, and coordinators with joining codes."],
  ["03", "Work the ground", "Register supporters, track issues, run polls, plan events, and message audiences."],
  ["04", "Win with intelligence", "Use live reports, AI insights, and polling station targets to close field gaps."],
];

export default function LandingPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "JUKWAA Kenya",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://jukwaakenya.co.ke",
    description: "A secure campaign management platform for Kenyan candidates and campaign teams.",
    offers: {
      "@type": "Offer",
      category: "SaaS",
      availability: "https://schema.org/InStock",
    },
    publisher: {
      "@type": "Organization",
      name: "JUKWAA Kenya",
      url: "https://jukwaakenya.co.ke",
      logo: "https://jukwaakenya.co.ke/icons/icon-512.png",
    },
  };

  return (
    <main className="j-landing-page min-h-screen text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link className="inline-flex items-center gap-3" href="/landing" aria-label="JUKWAA Kenya home">
          <Image src="/jukwaa-logo.png" alt="JUKWAA Kenya" width={220} height={70} priority className="h-12 w-auto object-contain" />
        </Link>
        <nav className="flex items-center gap-3">
          <Link className="hidden rounded-full border border-white/15 px-5 py-2 text-sm font-black text-white/85 transition hover:border-white/35 hover:bg-white/10 sm:inline-flex" href="/login">
            Sign in
          </Link>
          <Link className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:-translate-y-0.5 hover:bg-cyan-50" href="/signup/candidate">
            Create workspace <ArrowRight size={16} />
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Kenya campaign command platform
          </div>
          <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[0.96] text-white sm:text-6xl lg:text-7xl">
            Where leadership meets the people.
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-300">
            JUKWAA gives candidates one calm command centre for supporters, volunteers, polling agents, events, issues, payments, AI strategy, and voter pulse across Kenya.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-7 text-base font-black text-slate-950 shadow-xl shadow-cyan-500/15 transition hover:-translate-y-0.5" href="/signup/candidate">
              Launch your campaign <ArrowRight size={18} />
            </Link>
            <Link className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-white/14 bg-white/8 px-7 text-base font-black text-white transition hover:border-white/30 hover:bg-white/12" href="/login">
              Enter workspace
            </Link>
          </div>
        </div>

        <div className="j-landing-hero-card">
          <ElectionCountdown />
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              ["47", "counties"],
              ["290", "constituencies"],
              ["1,450", "wards"],
              ["46K+", "polling stations"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/7 p-4">
                <p className="text-3xl font-black text-cyan-200">{value}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-lg border border-amber-300/20 bg-amber-300/10 p-4">
            <p className="text-sm font-black text-amber-200">Built for every candidate level</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">President, Governor, Senator, Woman Rep, MP, MCA, campaign manager, volunteer, ward agent, and polling station agent workspaces stay scoped to the right geography.</p>
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-black/12 py-10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-5 text-center sm:px-8 lg:grid-cols-4">
          {[
            ["Live", "candidate dashboards"],
            ["Role-aware", "team permissions"],
            ["Public", "poll links"],
            ["Exportable", "branded reports"],
          ].map(([title, label]) => (
            <div key={label} className="rounded-lg border border-white/8 bg-white/5 p-5">
              <p className="text-2xl font-black text-white">{title}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-300">Platform features</p>
          <h2 className="mt-4 text-4xl font-black text-white sm:text-5xl">Everything the campaign needs</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-400">One operating system for the candidate, command team, field workers, and supporters on the ground.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map(([title, body, Icon, tone]) => (
            <article className="j-landing-feature" data-tone={tone} key={title as string}>
              <div className="j-landing-feature-icon">
                <Icon size={24} />
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <div className="j-landing-process">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-300">How it works</p>
          <h2 className="mt-4 text-4xl font-black text-white">From signup to election day</h2>
          <div className="mt-10 grid gap-4 lg:grid-cols-4">
            {steps.map(([number, title, body]) => (
              <div className="rounded-lg border border-white/10 bg-white/6 p-5" key={number}>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-300/35 bg-emerald-300/10 text-sm font-black text-emerald-300">{number}</span>
                <h3 className="mt-8 text-xl font-black text-white">{title}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-8">
        <div className="j-landing-cta">
          <Vote className="mx-auto text-cyan-300" size={42} />
          <h2>Ready to run a sharper campaign?</h2>
          <p>Start with the candidate workspace, then bring in the whole team with controlled access.</p>
          <div className="mt-8 flex justify-center">
            <Link className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-50" href="/signup/candidate">
              Create JUKWAA workspace <ArrowRight size={18} />
            </Link>
          </div>
          <p className="mt-7 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            <CheckCircle2 size={15} className="text-emerald-300" />
            Role-aware access - audit trail - Kenya geography
          </p>
        </div>
      </section>

      <footer className="border-t border-white/8 px-5 py-8 text-center text-sm font-semibold text-slate-500">
        JUKWAA Kenya (c) 2026. Where leadership meets the people.
      </footer>
    </main>
  );
}
