"use client";

import {
  Activity,
  AlertTriangle,
  Bell,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Flag,
  Gauge,
  LandPlot,
  LockKeyhole,
  MapPin,
  Menu,
  Navigation,
  Plus,
  Radio,
  Search,
  ShieldCheck,
  Target,
  Trophy,
  UserCheck,
  Users,
  Vote,
  X,
} from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  auditTrail,
  campaign,
  campaignEvents,
  candidatePositionScopes,
  communityIssues,
  eventAttendanceTrend,
  fieldVisits,
  groupCount,
  intelligenceReports,
  kenyaGeographySummary,
  notifications,
  pollingAnalytics,
  partyAffiliationOptions,
  politicalParties,
  reportRows,
  roles,
  supporters,
  summarizeCampaign,
  summarizePhaseTwo,
  territoryCoverage,
  users,
  volunteerPerformance,
  volunteerTasks,
  volunteers,
  type SupportLevel,
} from "@/lib/demo-data";

const navItems = [
  { label: "Dashboard", icon: Gauge },
  { label: "Supporters", icon: Users },
  { label: "Volunteers", icon: UserCheck },
  { label: "Field Operations", icon: ClipboardCheck },
  { label: "Community Issues", icon: AlertTriangle },
  { label: "Events & Rallies", icon: CalendarDays },
  { label: "Territory Coverage", icon: Target },
  { label: "Ground Intelligence", icon: Radio },
  { label: "Locations", icon: MapPin },
  { label: "Polling Stations", icon: Vote },
  { label: "Users", icon: ShieldCheck },
  { label: "Reports", icon: FileSpreadsheet },
  { label: "Audit Trail", icon: ClipboardList },
];

const futureItems = ["Communications", "Election Day", "Campaign Finance", "AI Intelligence"];

const supportColors: Record<SupportLevel, string> = {
  "Strong Supporter": "#0f766e",
  "Leaning Supporter": "#38bdf8",
  Undecided: "#f59e0b",
  Opponent: "#dc2626",
  Unknown: "#64748b",
};

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal-700 text-white shadow-sm">
        <Flag size={22} />
      </div>
      <div>
        <p className="text-lg font-bold tracking-[0.12em] text-slate-950">JUKWAA</p>
        <p className="text-[11px] font-medium text-slate-500">Where Leadership Meets the People</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, helper, icon: Icon }: { label: string; value: string; helper: string; icon: typeof Gauge }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-teal-700">
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">{helper}</p>
    </section>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  const mounted = useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-950">{title}</h2>
        <button className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label={`More options for ${title}`}>
          <ChevronDown size={16} />
        </button>
      </div>
      <div className="h-64 min-w-0">{mounted ? children : <div className="h-full rounded-md bg-slate-50" />}</div>
    </section>
  );
}

function PenetrationBadge({ value }: { value: number }) {
  const tone = value > 60 ? "bg-emerald-50 text-emerald-700" : value >= 30 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";
  return <span className={`rounded-md px-2 py-1 text-xs font-bold ${tone}`}>{value}%</span>;
}

function ExportButton({ type, label }: { type: "csv" | "xlsx" | "pdf"; label: string }) {
  return (
    <a
      href={`/api/reports/export?format=${type}&report=supporters-by-ward`}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
    >
      <Download size={15} />
      {label}
    </a>
  );
}

function StatusPill({ label }: { label: string }) {
  const tone = label.includes("Critical") || label.includes("Overdue") || label.includes("Poorly")
    ? "bg-red-50 text-red-700"
    : label.includes("High") || label.includes("Pending") || label.includes("Moderately")
      ? "bg-amber-50 text-amber-700"
      : label.includes("Completed") || label.includes("Active") || label.includes("Well")
        ? "bg-emerald-50 text-emerald-700"
        : "bg-slate-100 text-slate-600";
  return <span className={`rounded-md px-2 py-1 text-xs font-bold ${tone}`}>{label}</span>;
}

function ReportLink({ report, label }: { report: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 p-3">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="flex gap-1">
        {(["csv", "xlsx", "pdf"] as const).map((format) => (
          <a key={format} href={`/api/reports/export?format=${format}&report=${report}`} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold uppercase text-slate-600 hover:border-teal-200 hover:text-teal-700">
            {format}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [name, setName] = useState("Amina Wanjiru");
  const [phone, setPhone] = useState("+254710000000");
  const [overrideDuplicate, setOverrideDuplicate] = useState(false);
  const [selectedParty, setSelectedParty] = useState(campaign.politicalParty);
  const summary = summarizeCampaign();
  const phaseTwoSummary = summarizePhaseTwo();

  const duplicate = useMemo(() => {
    const normalizedPhone = phone.replace(/\D/g, "");
    return supporters.some((supporter) => supporter.phoneNumber.replace(/\D/g, "") === normalizedPhone) || supporters.some((supporter) => supporter.fullName.toLowerCase().includes(name.toLowerCase().trim()));
  }, [name, phone]);

  const supportLevelData = groupCount(supporters, "supportLevel");
  const wardData = groupCount(supporters, "ward");
  const genderData = groupCount(supporters, "gender");
  const ageData = groupCount(supporters, "ageGroup");
  const issueData = groupCount(supporters, "keyIssue").slice(0, 6);
  const stationData = groupCount(supporters, "pollingStation");
  const pollingRows = pollingAnalytics();
  const volunteerRows = volunteerPerformance();
  const coverageRows = territoryCoverage();
  const issueBreakdown = groupCount(communityIssues, "category");
  const eventTrend = eventAttendanceTrend();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white p-4 transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between">
          <Logo />
          <button className="rounded-md p-2 text-slate-500 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setActiveSection(item.label);
                setSidebarOpen(false);
              }}
              className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${activeSection === item.label ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-8 border-t border-slate-200 pt-5">
          <p className="px-3 text-xs font-bold uppercase tracking-wide text-slate-400">Future Modules</p>
          <div className="mt-2 space-y-1">
            {futureItems.map((item) => (
              <button key={item} className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-400" disabled>
                <LockKeyhole size={15} />
                {item}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button className="rounded-md border border-slate-200 p-2 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                <Menu size={20} />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Workspace</p>
                <h1 className="text-xl font-bold text-slate-950">{campaign.campaignName}</h1>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-end gap-2">
              <label className="hidden h-10 min-w-64 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 md:flex">
                <Search size={16} />
                <input className="w-full bg-transparent outline-none" placeholder="Search supporters, stations, users" />
              </label>
              <button className="hidden h-10 items-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-bold text-white transition hover:bg-teal-800 sm:inline-flex">
                <Plus size={16} />
                Invite User
              </button>
              <button className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-500" aria-label="Notifications">
                <Bell size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6">
          <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-semibold text-teal-700">{campaign.candidateName} for {campaign.positionTargeted}</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">{campaign.slogan}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Multi-tenant campaign operations for supporters, teams, polling stations, reports, and audit-ready political intelligence.
                </p>
              </div>
              <div className="grid min-w-64 grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="font-semibold text-slate-500">Election Year</p>
                  <p className="text-lg font-bold text-slate-950">{campaign.electionYear}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="font-semibold text-slate-500">Tenant</p>
                  <p className="text-lg font-bold text-slate-950">Isolated</p>
                </div>
                <div className="col-span-2 rounded-md bg-slate-50 p-3">
                  <p className="font-semibold text-slate-500">Party Affiliation</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">{selectedParty}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <StatCard label="Total Supporters" value={String(summary.totalSupporters)} helper="Captured in demo workspace" icon={Users} />
            <StatCard label="Strong Supporters" value={String(summary.strong)} helper="Ready for mobilization" icon={CheckCircle2} />
            <StatCard label="Undecided Voters" value={String(summary.undecided)} helper="Needs persuasion follow-up" icon={AlertTriangle} />
            <StatCard label="Volunteers Identified" value={String(summary.volunteers)} helper="Available for field work" icon={Activity} />
            <StatCard label="Stations Covered" value={String(summary.coveredStations)} helper="Polling station reach" icon={Vote} />
            <StatCard label="Wards Covered" value={String(summary.coveredWards)} helper="Geography coverage" icon={LandPlot} />
          </section>

          <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <StatCard label="Active Volunteers" value={String(phaseTwoSummary.activeVolunteers)} helper="Field-ready team members" icon={UserCheck} />
            <StatCard label="Tasks Completed" value={String(phaseTwoSummary.tasksCompleted)} helper="Closed operational work" icon={ClipboardCheck} />
            <StatCard label="Coverage %" value={`${phaseTwoSummary.coveragePercent}%`} helper="Composite territory score" icon={Target} />
            <StatCard label="Open Issues" value={String(phaseTwoSummary.openIssues)} helper="Citizen concerns to resolve" icon={AlertTriangle} />
            <StatCard label="Upcoming Events" value={String(phaseTwoSummary.upcomingEvents)} helper="Rallies and meetings ahead" icon={CalendarDays} />
            <StatCard label="Intel Reports" value={String(phaseTwoSummary.intelligenceReports)} helper="Ground reports received" icon={Radio} />
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-4">
            <ChartCard title="Volunteer Performance">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volunteerRows.slice(0, 5)} layout="vertical" margin={{ left: 32 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={106} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#0f766e" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Territory Coverage">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coverageRows}>
                  <XAxis dataKey="name" hide />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Event Attendance Trends">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={eventTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="expected" stroke="#94a3b8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="actual" stroke="#0f766e" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Community Issues Breakdown">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={issueBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={86} paddingAngle={2}>
                    {issueBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={["#0f766e", "#0284c7", "#f59e0b", "#dc2626", "#64748b"][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-3">
            <ChartCard title="Supporters by Ward">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wardData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0f766e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Support Levels">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={supportLevelData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={2}>
                    {supportLevelData.map((entry) => (
                      <Cell key={entry.name} fill={supportColors[entry.name as SupportLevel]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Top Community Issues">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={issueData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={92} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0284c7" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-2">
            <ChartCard title="Gender Distribution">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genderData}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0f766e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Age Distribution">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section className="mt-6 grid gap-4 2xl:grid-cols-[1.5fr_0.8fr]">
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">Supporter CRM</h2>
                  <p className="text-sm text-slate-500">Consent-aware supporter records with duplicate detection.</p>
                </div>
                <div className="flex gap-2">
                  <ExportButton type="csv" label="CSV" />
                  <ExportButton type="xlsx" label="Excel" />
                  <ExportButton type="pdf" label="PDF" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Ward</th>
                      <th className="px-4 py-3">Polling Station</th>
                      <th className="px-4 py-3">Support</th>
                      <th className="px-4 py-3">Issue</th>
                      <th className="px-4 py-3">Volunteer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supporters.slice(0, 9).map((supporter) => (
                      <tr key={supporter.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-950">{supporter.fullName}</td>
                        <td className="px-4 py-3 text-slate-600">{supporter.phoneNumber}</td>
                        <td className="px-4 py-3 text-slate-600">{supporter.ward}</td>
                        <td className="px-4 py-3 text-slate-600">{supporter.pollingStation}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-md px-2 py-1 text-xs font-bold" style={{ backgroundColor: `${supportColors[supporter.supportLevel]}18`, color: supportColors[supporter.supportLevel] }}>
                            {supporter.supportLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{supporter.keyIssue}</td>
                        <td className="px-4 py-3 text-slate-600">{supporter.volunteerInterest ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Quick Add Supporter</h2>
              <div className="mt-4 space-y-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Full name
                  <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-500" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Phone number
                  <input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-500" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Support level
                  <select className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-500">
                    {Object.keys(supportColors).map((level) => <option key={level}>{level}</option>)}
                  </select>
                </label>
                {duplicate && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <div className="flex gap-2 font-bold">
                      <AlertTriangle size={17} />
                      Possible duplicate supporter detected.
                    </div>
                    <label className="mt-3 flex items-center gap-2 font-semibold">
                      <input type="checkbox" checked={overrideDuplicate} onChange={(event) => setOverrideDuplicate(event.target.checked)} />
                      Override with permission
                    </label>
                  </div>
                )}
                <button disabled={duplicate && !overrideDuplicate} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300">
                  <Plus size={16} />
                  Save Supporter
                </button>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
              <div>
                <h2 className="text-sm font-bold text-slate-950">Polling Station Analytics</h2>
                <p className="text-sm text-slate-500">Penetration = identified supporters / registered voters x 100.</p>
              </div>
              <ChartCard title="Supporters by Polling Station">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stationData}>
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0f766e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Polling Station</th>
                    <th className="px-4 py-3">Ward</th>
                    <th className="px-4 py-3">Registered Voters</th>
                    <th className="px-4 py-3">Identified</th>
                    <th className="px-4 py-3">Strong</th>
                    <th className="px-4 py-3">Undecided</th>
                    <th className="px-4 py-3">Penetration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pollingRows.map((station) => (
                    <tr key={station.id}>
                      <td className="px-4 py-3 font-semibold text-slate-950">{station.name}</td>
                      <td className="px-4 py-3 text-slate-600">{station.ward}</td>
                      <td className="px-4 py-3 text-slate-600">{station.registeredVoters.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-600">{station.identifiedSupporters}</td>
                      <td className="px-4 py-3 text-slate-600">{station.strong}</td>
                      <td className="px-4 py-3 text-slate-600">{station.undecided}</td>
                      <td className="px-4 py-3"><PenetrationBadge value={station.penetration} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-6 grid gap-4 2xl:grid-cols-[1.2fr_0.9fr]">
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">Volunteer Management</h2>
                  <p className="text-sm text-slate-500">Recruitment, supervision, status, and performance scoring.</p>
                </div>
                <ReportLink report="volunteer-performance" label="Performance Report" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Volunteer</th>
                      <th className="px-4 py-3">Assigned Area</th>
                      <th className="px-4 py-3">Supervisor</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Supporters</th>
                      <th className="px-4 py-3">Activities</th>
                      <th className="px-4 py-3">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {volunteerRows.map((row) => {
                      const volunteer = volunteers.find((item) => item.fullName === row.name);
                      return (
                        <tr key={row.name} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-950">{row.name}</p>
                            <p className="text-xs text-slate-500">{volunteer?.phoneNumber}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{row.area}</td>
                          <td className="px-4 py-3 text-slate-600">{volunteer?.assignedSupervisor}</td>
                          <td className="px-4 py-3"><StatusPill label={volunteer?.status ?? "Unknown"} /></td>
                          <td className="px-4 py-3 text-slate-600">{row.supportersRegistered}</td>
                          <td className="px-4 py-3 text-slate-600">{row.activitiesCompleted}</td>
                          <td className="px-4 py-3 font-bold text-teal-700">{row.score}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">60-Second Field Actions</h2>
              <p className="mt-1 text-sm text-slate-500">Large mobile-first controls for common field submissions.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  ["Register Supporter", Users],
                  ["Submit Issue", AlertTriangle],
                  ["Submit Field Visit", Navigation],
                  ["Upload Photo", Camera],
                  ["Complete Task", CheckCircle2],
                  ["Report Intelligence", Radio],
                ].map(([label, Icon]) => (
                  <button key={String(label)} className="flex min-h-20 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left text-sm font-bold text-slate-800 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-teal-700 shadow-sm">
                      <Icon size={20} />
                    </span>
                    {String(label)}
                  </button>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Quick Task Completion</p>
                <div className="mt-3 space-y-2">
                  {volunteerTasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 p-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{task.title}</p>
                        <p className="text-xs text-slate-500">{task.assignedTo} - due {task.dueDate}</p>
                      </div>
                      <StatusPill label={task.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">Territory Activity Map</h2>
                  <p className="text-sm text-slate-500">GPS activity, ignored areas, and movement patterns.</p>
                </div>
                <ReportLink report="territory-coverage" label="Coverage Report" />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {coverageRows.map((row) => (
                  <div key={row.name} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{row.name}</p>
                        <p className="text-xs text-slate-500">{row.ward} / {row.village}</p>
                      </div>
                      <StatusPill label={row.status} />
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-100">
                      <div className={`h-2 rounded-full ${row.score >= 70 ? "bg-emerald-500" : row.score >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${row.score}%` }} />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{row.score}% coverage from supporters, visits, events, and issues.</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {fieldVisits.map((visit) => (
                  <div key={visit.id} className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-slate-950">{visit.volunteer}</p>
                      <span className="font-mono text-xs text-slate-500">{visit.latitude.toFixed(4)}, {visit.longitude.toFixed(4)}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{visit.visitPurpose} at {visit.pollingStation}</p>
                    <p className="mt-2 text-xs text-slate-500">{visit.supportersEngaged} engaged - {visit.photos} photos - {visit.date} {visit.startTime}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Volunteer Leaderboard</h2>
              <div className="mt-4 space-y-3">
                {volunteerRows.slice(0, 5).map((row, index) => (
                  <div key={row.name} className="flex items-center gap-3 rounded-md bg-slate-50 p-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-teal-700 text-sm font-bold text-white">
                      {index === 0 ? <Trophy size={18} /> : index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-950">{row.name}</p>
                      <p className="text-xs text-slate-500">{row.supportersRegistered} supporters - {row.issuesSubmitted} issues - {row.eventsAttended} events</p>
                    </div>
                    <span className="text-sm font-bold text-teal-700">{row.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Community Issues</h2>
                <ReportLink report="community-issues" label="Issues" />
              </div>
              <div className="mt-4 space-y-3">
                {communityIssues.map((issue) => (
                  <div key={issue.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{issue.title}</p>
                        <p className="text-xs text-slate-500">{issue.category} - {issue.ward} / {issue.village}</p>
                      </div>
                      <StatusPill label={issue.priority} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{issue.description}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{issue.mentions} mentions - {issue.status}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Events & Rallies</h2>
                <ReportLink report="event-attendance" label="Attendance" />
              </div>
              <div className="mt-4 space-y-3">
                {campaignEvents.map((event) => (
                  <div key={event.id} className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{event.title}</p>
                        <p className="text-xs text-slate-500">{event.type} - {event.date} {event.startTime}</p>
                      </div>
                      <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-600">{event.actualAttendance || "Planned"}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{event.venue} - organized by {event.organizer}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">Expected {event.expectedAttendance.toLocaleString()} - New supporters {event.newSupporters}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Ground Intelligence</h2>
                <ReportLink report="ground-intelligence-summary" label="Intel" />
              </div>
              <div className="mt-4 space-y-3">
                {intelligenceReports.map((report) => (
                  <div key={report.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{report.title}</p>
                        <p className="text-xs text-slate-500">{report.category} - {report.location}</p>
                      </div>
                      <StatusPill label={report.urgency} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{report.description}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{report.submittedBy} - {report.createdAt} - {report.photos} photos</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Internal Notifications</h2>
              <div className="mt-4 space-y-3">
                {notifications.map((notification) => (
                  <div key={notification.title} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-sm font-bold text-slate-950">{notification.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{notification.detail}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
              <h2 className="text-sm font-bold text-slate-950">Phase 2 Report Center</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ReportLink report="volunteer-performance" label="Volunteer Performance Report" />
                <ReportLink report="territory-coverage" label="Territory Coverage Report" />
                <ReportLink report="community-issues" label="Community Issues Report" />
                <ReportLink report="event-attendance" label="Event Attendance Report" />
                <ReportLink report="ground-intelligence-summary" label="Ground Intelligence Summary" />
                <ReportLink report="ward-activity" label="Ward Activity Report" />
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Campaign Setup Wizard</h2>
              <div className="mt-4 space-y-3">
                {["Create Campaign", "Candidate Information", "Branding", "Create Admin User", "Launch Workspace"].map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${index < 4 ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-500"}`}>{index + 1}</div>
                    <span className="text-sm font-semibold text-slate-700">{step}</span>
                  </div>
                ))}
              </div>
              <label className="mt-5 block text-sm font-semibold text-slate-700">
                Party affiliation at signup
                <select value={selectedParty} onChange={(event) => setSelectedParty(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-500">
                  {partyAffiliationOptions.map((option) => (
                    <option key={option.id} value={option.displayName}>
                      {option.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Candidates can register under a political party or continue as an independent candidate.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Users and Roles</h2>
              <div className="mt-4 space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.role} - {user.geography}</p>
                    </div>
                    <span className="text-xs font-bold text-teal-700">{user.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Audit Trail</h2>
              <div className="mt-4 space-y-3">
                {auditTrail.map((event) => (
                  <div key={`${event.user}-${event.timestamp}`} className="border-l-2 border-teal-600 pl-3">
                    <p className="text-sm font-bold text-slate-950">{event.action} - {event.module}</p>
                    <p className="text-xs text-slate-500">{event.user} at {event.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-950">Reusable Location Hierarchy and Report Catalog</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Country {"->"} County {"->"} Constituency {"->"} Ward {"->"} Village {"->"} Polling Station</div>
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Role geography assignment supports constituency, ward, village, and station scoping.</div>
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">{roles.length} built-in roles mapped for campaign operations.</div>
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">{reportRows("key-issues-analysis").length} report groups available for export.</div>
            </div>
          </section>

          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-950">Kenya Political Party Register</h2>
                <p className="text-sm text-slate-500">ORPP fully registered parties, May 2026. Signup also includes Independent Candidate above the party list.</p>
              </div>
              <span className="rounded-md bg-teal-50 px-3 py-1 text-sm font-bold text-teal-700">{politicalParties.length} registered parties</span>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {partyAffiliationOptions.slice(0, 17).map((option) => (
                <div key={option.id} className={`rounded-md border p-3 text-sm ${option.affiliationType === "Independent" || option.party?.featuredRank ? "border-teal-200 bg-teal-50 text-teal-900" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                  <p className="font-bold">{option.displayName}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {option.affiliationType === "Independent" ? "Signup option" : `Register #${option.party?.registerSerial}${option.party?.featuredRank ? ` - Featured ${option.party.featuredRank}` : ""}`}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-950">Kenya Candidate Geography Setup</h2>
                <p className="text-sm text-slate-500">Geography catalog supports candidates from President down to MCA.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">{kenyaGeographySummary.counties} counties</span>
                <span className="rounded-md bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">{kenyaGeographySummary.constituencies} constituencies</span>
                <span className="rounded-md bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">{kenyaGeographySummary.extractedWardEntries} ward entries</span>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {candidatePositionScopes.map((scope) => (
                <div key={scope.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-slate-950">{scope.displayName}</p>
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-teal-700">{scope.geographyLevel}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{scope.description}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">Source: {kenyaGeographySummary.source}. The raw constituency area text is preserved in Supabase for auditability.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
