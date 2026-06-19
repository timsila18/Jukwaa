"use client";

import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Bell,
  Brain,
  Building2,
  CalendarDays,
  Camera,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Download,
  Gauge,
  Globe2,
  HandCoins,
  KeyRound,
  LandPlot,
  Menu,
  MessageSquare,
  Navigation,
  Plus,
  Radio,
  RadioTower,
  ReceiptText,
  Search,
  ShieldCheck,
  Siren,
  Smartphone,
  Trophy,
  UserCheck,
  UserCog,
  Users,
  UsersRound,
  Settings,
  Video,
  UploadCloud,
  Vote,
  WalletCards,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { accessibleTextColor, validateWorkspaceBranding } from "@/lib/design-system";
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
  communicationMessages,
  communicationRooms,
  candidatePositionScopes,
  communityIssues,
  eventAttendanceTrend,
  electionAlerts,
  electionForms,
  electionIncidents,
  fieldVisits,
  agentDeploymentRows,
  aiContentAssets,
  aiStrategyQueue,
  budgetVarianceRows,
  campaignDocuments,
  groupCount,
  intelligenceReports,
  candidateBranding,
  candidateProfiles,
  electionCycles,
  featureEntitlements,
  fundraisingCampaigns,
  invitations,
  kenyaGeographySummary,
  notifications,
  pollingAnalytics,
  pollingResults,
  partyAffiliationOptions,
  pvtQualityQueue,
  pvtTotals,
  politicalParties,
  reportRows,
  roles,
  securityEvents,
  supporters,
  summarizeGovernance,
  supporterMobilizationAnalytics,
  solcoIntegration,
  teamHierarchyRows,
  territoryCoverage,
  turnoutTrend,
  users,
  volunteerPerformance,
  volunteerTasks,
  volunteers,
  workspaceOwnership,
  workspaceSubscription,
  invoices,
  payments,
  platformWorkspaceMetrics,
  donations,
  expenses,
  knowledgeArticles,
  mpesaPaymentSetting,
  mpesaTransactions,
  predictiveInsights,
  scenarioPlans,
  type SupportLevel,
} from "@/lib/demo-data";

const navItems = [
  { label: "Dashboard", icon: Gauge },
  { label: "Supporters", icon: Users },
  { label: "Volunteers", icon: UserCheck },
  { label: "Polling Agents", icon: RadioTower },
  { label: "Tasks & Field Ops", icon: ClipboardCheck },
  { label: "Events", icon: CalendarDays },
  { label: "Communications", icon: MessageSquare },
  { label: "Issues & Manifesto", icon: HandCoins },
  { label: "Reports & Analytics", icon: BarChart3 },
  { label: "AI Campaign Studio", icon: Brain, badge: "NEW" },
  { label: "Payments & Billing", icon: WalletCards },
  { label: "Team & Roles", icon: UsersRound },
  { label: "Settings", icon: Settings },
];

const sectionTargets: Record<string, string> = {
  Dashboard: "dashboard",
  Supporters: "supporters",
  Volunteers: "volunteers",
  "Field Operations": "field-operations",
  "Tasks & Field Ops": "field-operations",
  "Community Issues": "community-issues",
  "Issues & Manifesto": "community-issues",
  "Events & Rallies": "events-rallies",
  Events: "events-rallies",
  "Territory Coverage": "territory-coverage",
  "Ground Intelligence": "ground-intelligence",
  "Election Operations": "election-operations",
  "Polling Agents": "election-operations",
  "Turnout Monitoring": "turnout-monitoring",
  "Incident Reporting": "election-operations",
  "Results Center": "results-center",
  "Situation Room": "super-admin",
  "Candidate Management": "candidate-management",
  "Workspace Governance": "workspace-governance",
  Invitations: "invitations",
  Subscriptions: "subscriptions",
  "Payments & Billing": "subscriptions",
  "Super Admin": "super-admin",
  Communications: "communications",
  "AI Campaign Assistant": "ai-assistant",
  "AI Campaign Studio": "ai-assistant",
  "Campaign Finance": "campaign-finance",
  "M-Pesa Payments": "mpesa-payments",
  "Predictive Analytics": "predictive-analytics",
  "Document Center": "document-center",
  "Knowledge Center": "knowledge-center",
  Locations: "locations",
  "Polling Stations": "polling-stations",
  Users: "users",
  "Team & Roles": "users",
  Reports: "reports",
  "Reports & Analytics": "reports",
  "Audit Trail": "audit-trail",
  Settings: "workspace-governance",
};

const supportColors: Record<SupportLevel, string> = {
  "Strong Supporter": "#0ea5e9",
  "Leaning Supporter": "#38bdf8",
  Undecided: "#f59e0b",
  Opponent: "#dc2626",
  Unknown: "#64748b",
};

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

type LiveBootstrap = {
  workspace: {
    role: string;
    isPlatformAdmin: boolean;
    access?: {
      allowed: boolean;
      status: string;
      reason: string;
      subscriptionStatus?: string | null;
      onboardingStatus?: string | null;
      paymentStatus?: string | null;
    };
  };
  campaign?: {
    campaign_name?: string;
    candidate_name?: string;
    position_targeted?: string;
    political_party?: string;
    election_year?: string;
    slogan?: string;
  } | null;
  summary: {
    supporters: number;
    volunteers: number;
    issues: number;
    events: number;
    payments: number;
    invitations: number;
  };
};

function Logo() {
  return (
    <div className="flex items-center">
      <Image
        src="/jukwaa-logo-sidebar.png"
        alt="JUKWAA - Where Leadership Meets the People"
        width={520}
        height={165}
        priority
        className="h-[66px] w-full max-w-[208px] rounded-sm object-cover object-center"
      />
    </div>
  );
}

function ChartCard({ title, children, report = "supporters-by-ward" }: { title: string; children: React.ReactNode; report?: string }) {
  const mounted = useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-950">{title}</h2>
        <a href={`/api/reports/export?format=csv&report=${report}`} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label={`Download data for ${title}`}>
          <ChevronDown size={16} />
        </a>
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
      className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800"
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
          <a key={format} href={`/api/reports/export?format=${format}&report=${report}`} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold uppercase text-slate-600 hover:border-sky-200 hover:text-sky-700">
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
  const [aiQuestion, setAiQuestion] = useState("Which wards need attention this week?");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [meetingIdentity, setMeetingIdentity] = useState("campaign-manager");
  const [meetingTokenStatus, setMeetingTokenStatus] = useState("");
  const [meetingTokenError, setMeetingTokenError] = useState("");
  const [meetingTokenLoading, setMeetingTokenLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [liveBootstrap, setLiveBootstrap] = useState<LiveBootstrap | null>(null);
  const governanceSummary = summarizeGovernance();
  const platformMetrics = platformWorkspaceMetrics();
  const brandingReview = useMemo(() => validateWorkspaceBranding(candidateBranding), []);

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
  const agentRows = agentDeploymentRows();
  const turnoutRows = turnoutTrend();
  const mobilizationRows = supporterMobilizationAnalytics();
  const pvtRows = pvtTotals();
  const qualityQueue = pvtQualityQueue();
  const hierarchyRows = teamHierarchyRows();
  const aiRows = aiStrategyQueue();
  const budgetRows = budgetVarianceRows();

  useEffect(() => {
    let active = true;
    fetch("/api/dashboard/bootstrap")
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) {
          window.location.assign(`/login?next=${encodeURIComponent("/")}`);
          return null;
        }
        if (!response.ok) return null;
        return response.json() as Promise<LiveBootstrap>;
      })
      .then((payload) => {
        if (active && payload) setLiveBootstrap(payload);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const commercialAccess = liveBootstrap?.workspace.access;
  const activationInvoice = invoices.find((invoice) => invoice.status !== "Paid") ?? invoices[0];
  const paymentUrl = `/payment/confirm?accountReference=${encodeURIComponent(mpesaPaymentSetting.accountReferenceFormat)}&phoneNumber=${encodeURIComponent(candidateProfiles[0]?.phoneNumber ?? "")}&amountKes=${activationInvoice?.amountKes ?? 45000}`;
  const referenceCandidateName = "Tim Sila";
  const referenceWorkspaceName = "Kalonzo Musyoka Campaign";
  const dashboardMetrics = [
    { label: "Supporters", value: "24,860", helper: "+12.4% vs last 7 days", icon: Users, tone: "sky" },
    { label: "Volunteers", value: "1,245", helper: "+8.7% vs last 7 days", icon: UserCheck, tone: "gold" },
    { label: "Polling Agents", value: "386", helper: "+15.3% vs last 7 days", icon: ShieldCheck, tone: "emerald" },
    { label: "Tasks Completed", value: "78%", helper: "+6.1% vs last 7 days", icon: CheckCircle2, tone: "violet" },
    { label: "Events This Month", value: "9", helper: "+2 vs last 7 days", icon: CalendarDays, tone: "red" },
  ];
  const actionQueue = [
    { label: "New Supporter Registrations", value: 238, icon: Users, tone: "sky" },
    { label: "Volunteer Applications", value: 15, icon: UserCheck, tone: "gold" },
    { label: "Polling Agent Applications", value: 9, icon: ShieldCheck, tone: "emerald" },
    { label: "Incident Reports", value: 7, icon: Siren, tone: "red" },
    { label: "Tasks Overdue", value: 11, icon: AlertTriangle, tone: "amber" },
  ];
  const progressRows = [
    ["Organization", 85, Building2],
    ["Field Operations", 68, ClipboardCheck],
    ["Communications", 74, MessageSquare],
    ["Fundraising", 59, HandCoins],
    ["Voter Outreach", 78, Vote],
  ] as const;
  const quickActions = [
    ["Add Supporter", Users, "Supporters"],
    ["Create Task", CheckCircle2, "Field Operations"],
    ["Add Volunteer", UserCheck, "Volunteers"],
    ["Report Issue", Siren, "Community Issues"],
    ["Create Event", CalendarDays, "Events & Rallies"],
    ["AI Assistant", Brain, "AI Campaign Assistant"],
  ] as const;
  const recentActivityRows = [
    ["Supporter Registration", "New supporter in Makueni County", "Field Agent - John M.", "2 min ago", "New"],
    ["Volunteer Application", "Application from Mary Wanjiku", "System", "15 min ago", "Pending"],
    ["Task Completed", "Door-to-door canvassing in Ward 3", "Volunteer - James K.", "1 hour ago", "Completed"],
    ["Payment Received", "M-Pesa payment of KES 25,000", "System", "3 hours ago", "Confirmed"],
    ["Incident Reported", "Voter intimidation in Polling Station 12", "Agent - Peter O.", "5 hours ago", "Open"],
  ];
  const countyBreakdown = [
    ["Nairobi", "6,142 (24.7%)", "#1d6fff"],
    ["Makueni", "3,942 (15.9%)", "#d6a200"],
    ["Machakos", "3,214 (12.9%)", "#16a34a"],
    ["Kitui", "2,487 (10.0%)", "#7c3aed"],
    ["Kajiado", "2,031 (8.2%)", "#f97316"],
    ["Others", "7,044 (28.3%)", "#d1d5db"],
  ] as const;
  const workspaceFeatures = {
    Dashboard: {
      title: "Campaign Command Center",
      description: "A full overview of campaign growth, team actions, payments, communications, and field readiness.",
      cards: [
        ["Live Metrics", "Supporters, volunteers, agents, tasks, and events in one view.", Gauge],
        ["Action Queue", "Approvals, incidents, overdue tasks, and new registrations.", AlertTriangle],
        ["Readiness", "Polling day and field operations progress at a glance.", ShieldCheck],
      ],
    },
    Supporters: {
      title: "Supporter Management",
      description: "Register, segment, search, mobilize, and follow up with voters and supporters by geography.",
      cards: [
        ["Register Supporters", "Capture name, phone, ward, station, issue, and support level.", Users],
        ["Duplicate Checks", "Flag repeated phone numbers and names before saving.", ShieldCheck],
        ["Mobilization Lists", "Filter supporters for calls, SMS, rallies, and door-to-door follow-up.", MessageSquare],
      ],
    },
    Volunteers: {
      title: "Volunteer Operations",
      description: "Manage volunteer applications, assignments, task progress, and field performance.",
      cards: [
        ["Create Volunteer", "Add field volunteers and assign them to wards or polling stations.", UserCheck],
        ["Assign Tasks", "Track canvassing, registration drives, and event mobilization work.", ClipboardCheck],
        ["Performance", "View completed tasks, coverage, and volunteer accountability.", BarChart3],
      ],
    },
    "Polling Agents": {
      title: "Polling Agent Workspace",
      description: "Recruit, assign, train, and monitor polling station agents before and during election day.",
      cards: [
        ["Agent Register", "Manage agents per station, ward, and constituency.", RadioTower],
        ["Station Coverage", "See gaps in coverage before polling day.", Vote],
        ["Incident Escalation", "Let agents report issues, turnout, and form status.", Siren],
      ],
    },
    "Tasks & Field Ops": {
      title: "Tasks & Field Operations",
      description: "Coordinate field visits, door-to-door campaigns, incident follow-ups, and operational tasks.",
      cards: [
        ["Create Task", "Assign work to volunteers, agents, and coordinators.", CheckCircle2],
        ["Field Visits", "Record visits, photos, results, and notes from the ground.", Navigation],
        ["Coverage Map", "Track ward, village, and polling station progress.", LandPlot],
      ],
    },
    Events: {
      title: "Events Workspace",
      description: "Plan rallies, town halls, fundraisers, meetings, attendance, and mobilization targets.",
      cards: [
        ["Create Event", "Set date, venue, county, constituency, and expected turnout.", CalendarDays],
        ["Mobilize", "Send teams and supporter lists to fill attendance gaps.", UsersRound],
        ["Attendance", "Track registrations, check-ins, and post-event follow-up.", BadgeCheck],
      ],
    },
    Communications: {
      title: "Live Communications",
      description: "Run team chat, voice rooms, video meetings, broadcasts, and Solco/LiveKit coordination.",
      cards: [
        ["Team Chat", "Coordinate campaign teams and field operations.", MessageSquare],
        ["Voice & Video", "Open live rooms for war-room and field team meetings.", Video],
        ["Broadcasts", "Prepare announcements, SMS drafts, and WhatsApp-ready updates.", RadioTower],
      ],
    },
    "Issues & Manifesto": {
      title: "Issues & Manifesto",
      description: "Track citizen concerns, manifesto promises, responses, and issue resolution progress.",
      cards: [
        ["Report Issue", "Capture local issues by ward, village, and category.", AlertTriangle],
        ["Assign Response", "Route concerns to the right team member for action.", ClipboardCheck],
        ["Manifesto Link", "Connect issues to campaign pledges and follow-up messages.", HandCoins],
      ],
    },
    "Reports & Analytics": {
      title: "Reports & Analytics",
      description: "Export campaign reports, analyze performance, and prepare leadership-ready summaries.",
      cards: [
        ["Export Reports", "Download supporter, volunteer, finance, and field reports.", Download],
        ["Analytics", "Review growth, coverage, turnout, and mobilization trends.", BarChart3],
        ["Audit Ready", "Keep activity and decision history traceable.", ShieldCheck],
      ],
    },
    "AI Campaign Studio": {
      title: "AI Campaign Studio",
      description: "Generate speeches, SMS drafts, reports, strategy briefs, and campaign recommendations.",
      cards: [
        ["Strategy Briefs", "Ask AI for ward priorities and campaign risks.", Brain],
        ["Content Drafts", "Prepare speeches, SMS, and event talking points.", MessageSquare],
        ["Data Context", "Use campaign records to ground recommendations.", Gauge],
      ],
    },
    "Payments & Billing": {
      title: "Payments & Billing",
      description: "Manage subscription status, invoices, M-Pesa confirmation, and workspace activation.",
      cards: [
        ["Make Payment", "Use Paybill or payment confirmation to activate access.", WalletCards],
        ["Admin Approval", "Allow access before payment when approved by admin.", ShieldCheck],
        ["Invoices", "Track renewals, plans, and billing status.", ReceiptText],
      ],
    },
    "Team & Roles": {
      title: "Team & Roles",
      description: "Invite users, assign roles, approve team access, and manage campaign permissions.",
      cards: [
        ["Invite Users", "Generate joining codes for campaign team onboarding.", KeyRound],
        ["Role Control", "Assign owner, manager, coordinator, volunteer, and agent roles.", UsersRound],
        ["Approvals", "Approve, suspend, or revoke team access.", ShieldCheck],
      ],
    },
    Settings: {
      title: "Workspace Settings",
      description: "Manage workspace governance, branding, access rules, security, and ownership details.",
      cards: [
        ["Workspace Profile", "Review candidate, party, position, and geography details.", Building2],
        ["Security", "Track logins, audit events, and sensitive actions.", ShieldCheck],
        ["Policies", "Open privacy, consent, ownership, and support settings.", Settings],
      ],
    },
  };
  const activeSectionId = sectionTargets[activeSection] ?? sectionTargets.Dashboard;
  const activeSubtitle = activeSection === "Dashboard" ? "Overview of your campaign operations" : `Manage ${activeSection.toLowerCase()} for this workspace`;
  const activeWorkspaceFeatures = workspaceFeatures[activeSection as keyof typeof workspaceFeatures] ?? workspaceFeatures.Dashboard;

  function sectionClass(sectionId: string, baseClassName: string) {
    return activeSectionId === sectionId ? baseClassName : "hidden";
  }

  function scrollToSection(label: string) {
    setActiveSection(label);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function runAction(message: string, sectionLabel: string) {
    setActionMessage(message);
    scrollToSection(sectionLabel);
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      setActionMessage("");
      window.location.assign("/login");
    }
  }

  async function persistWorkflow(workflow: string, payload: Record<string, unknown>, successMessage: string, sectionLabel: string) {
    try {
      const response = await fetch(`/api/workflows/${workflow}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Workflow could not be saved.");
      }
      runAction(successMessage, sectionLabel);
    } catch (error) {
      runAction(error instanceof Error ? error.message : "Workflow could not be saved.", sectionLabel);
    }
  }

  async function askJukwaaAi(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAiLoading(true);
    setAiError("");
    setAiAnswer("");

    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: aiQuestion }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "JUKWAA AI could not answer right now.");
      }
      setAiAnswer(payload.answer ?? "");
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "JUKWAA AI could not answer right now.");
    } finally {
      setAiLoading(false);
    }
  }

  async function issueMeetingToken(roomName: string) {
    setMeetingTokenLoading(true);
    setMeetingTokenError("");
    setMeetingTokenStatus("");

    try {
      const response = await fetch("/api/communications/livekit-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName,
          identity: meetingIdentity,
          displayName: "Campaign Manager",
          role: "host",
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "LiveKit token could not be issued.");
      }
      const roomPath = solcoIntegration.meetingPath.replace("{roomName}", payload.roomName);
      setMeetingTokenStatus(`Token issued for ${payload.roomName}. Join through Solco-compatible room URL ${solcoIntegration.workspaceUrl}${roomPath}.`);
    } catch (error) {
      setMeetingTokenError(error instanceof Error ? error.message : "LiveKit token could not be issued.");
    } finally {
      setMeetingTokenLoading(false);
    }
  }

  return (
    <main className="j-shell">
      <aside className={`j-premium-shell fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-white/10 p-4 transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between">
          <Logo />
          <button className="rounded-md p-2 text-slate-300 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.055] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Current Workspace</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-white">{referenceWorkspaceName}</p>
            <ChevronDown size={16} className="text-slate-300" />
          </div>
          <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400" />Active</p>
        </div>
        <nav className="mt-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => scrollToSection(item.label)}
              className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-[12px] font-semibold transition ${activeSection === item.label ? "j-premium-nav-active" : "j-premium-nav"}`}
            >
              <item.icon size={16} />
              <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
              {"badge" in item ? <span className="rounded bg-amber-300 px-1.5 py-0.5 text-[10px] font-black text-slate-950">{item.badge}</span> : null}
              {item.label === "Communications" ? <ChevronDown size={14} className="rotate-[-90deg]" /> : null}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-lg border border-amber-400/55 bg-amber-400/5 p-3">
          <p className="flex items-center gap-2 text-xs font-black text-amber-300"><Trophy size={14} />Premium Plan</p>
          <p className="mt-2 text-xs text-slate-300">Expires on 24 Aug 2026</p>
          <div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-2 w-[78%] rounded-full bg-amber-400" /></div>
          <p className="mt-2 text-xs text-slate-300">71 days remaining</p>
          <button className="mt-3 h-9 w-full rounded-md border border-amber-300/50 text-xs font-bold text-amber-100 hover:bg-amber-300/10" onClick={() => scrollToSection("Subscriptions")} type="button">Manage Subscription</button>
        </div>
        <div className="mt-4 border-t border-white/10 pt-4">
          <button className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left hover:bg-white/10" onClick={() => scrollToSection("Candidate Management")} type="button">
            <span className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-sm font-black text-slate-950">{referenceCandidateName.slice(0, 1)}</span>
              <span>
                <span className="block text-sm font-bold text-white">{referenceCandidateName}</span>
                <span className="block text-xs text-slate-400">Campaign Owner</span>
              </span>
            </span>
            <ChevronDown size={16} className="text-slate-300" />
          </button>
        </div>
        <div className="mt-2">
          <button className="flex h-9 items-center gap-3 rounded-md px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/10" onClick={() => setSidebarOpen(false)} type="button">
            <ChevronDown className="rotate-90" size={16} />
            Collapse
          </button>
        </div>
      </aside>

      <div className="lg:pl-[240px]">
        <header className="j-main-topbar sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-4 py-3 text-slate-950 shadow-[0_10px_30px_rgba(7,17,31,0.06)] backdrop-blur lg:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button className="rounded-md border border-slate-200 p-2 text-slate-950 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-xl font-black text-slate-950">{activeSection}</h1>
                <p className="text-xs font-semibold text-slate-600">{activeSubtitle}</p>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-end gap-2">
              <label className="hidden h-10 min-w-[300px] items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 shadow-sm xl:flex">
                <Search size={16} />
                <input className="w-full bg-transparent outline-none placeholder:text-slate-400" placeholder="Search supporters, tasks, events..." />
                <span className="rounded bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">Ctrl K</span>
              </label>
              <button className="relative grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-white text-slate-950 shadow-sm" aria-label="Notifications" onClick={() => runAction("Opening internal notifications and audit trail.", "Audit Trail")} type="button">
                <Bell size={18} />
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[10px] font-black text-white">7</span>
              </button>
              <button className="relative grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-white text-slate-950 shadow-sm" aria-label="Messages" onClick={() => scrollToSection("Communications")} type="button">
                <MessageSquare size={18} />
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-[10px] font-black text-white">3</span>
              </button>
              <button className="hidden h-10 items-center gap-3 rounded-md border-l border-slate-200 pl-3 text-left sm:inline-flex" onClick={() => scrollToSection("Candidate Management")} type="button">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-sm font-black text-slate-700 ring-1 ring-slate-200">{referenceCandidateName.slice(0, 1)}</span>
                <span>
                  <span className="block text-sm font-black text-slate-950">{referenceCandidateName}</span>
                  <span className="block text-xs font-semibold text-slate-600">Owner</span>
                </span>
                <ChevronDown size={16} className="text-slate-700" />
              </button>
            </div>
          </div>
        </header>

        <div className="j-workspace-content p-4 lg:p-6 xl:p-7">
          <section id="dashboard" className={sectionClass("dashboard", "scroll-mt-24")}>
            <section className="j-command-center mb-5 rounded-lg border border-amber-200/90 bg-white p-5 shadow-sm">
              <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr_1.45fr] lg:items-center">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">Campaign Command Center</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Track progress, engage supporters, and win with data.</p>
                </div>
                <div className="border-slate-200 lg:border-l lg:pl-6">
                  <p className="text-sm font-bold text-slate-700">Campaign Readiness</p>
                  <div className="mt-1 flex items-center gap-4">
                    <span className="text-3xl font-black text-amber-600">68%</span>
                    <span className="h-2 flex-1 rounded-full bg-slate-200">
                      <span className="block h-2 w-[68%] rounded-full bg-amber-500" />
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">You&apos;re making great progress!</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#07111f] px-4 text-sm font-black text-white shadow-[0_14px_28px_rgba(7,17,31,0.2)] transition hover:bg-[#0f1f34]" onClick={() => scrollToSection("Supporters")} type="button">
                    <Users size={17} />
                    Add Supporter
                  </button>
                  <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-50" onClick={() => scrollToSection("Tasks & Field Ops")} type="button">
                    <CheckCircle2 size={17} className="text-amber-600" />
                    Create Task
                  </button>
                  <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-50" onClick={() => scrollToSection("Events")} type="button">
                    <CalendarDays size={17} className="text-amber-600" />
                    Create Event
                  </button>
                </div>
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {dashboardMetrics.map((metric) => (
                <section key={metric.label} className="j-dashboard-card rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-700">{metric.label}</p>
                      <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{metric.value}</p>
                      <p className="mt-2 text-xs font-black text-emerald-600">↑ {metric.helper}</p>
                    </div>
                    <div className={`grid h-11 w-11 place-items-center rounded-lg ${
                      metric.tone === "gold" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                        : metric.tone === "emerald" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                          : metric.tone === "violet" ? "bg-violet-50 text-violet-700 ring-1 ring-violet-100"
                            : metric.tone === "red" ? "bg-red-50 text-red-600 ring-1 ring-red-100"
                              : "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                    }`}>
                      <metric.icon size={20} />
                    </div>
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[1.22fr_1.05fr_1fr]">
              <section className="j-dashboard-card rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-black text-slate-950">Supporter Growth</h2>
                  <button className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600" type="button">Last 30 days <ChevronDown size={14} /></button>
                </div>
                <div className="relative h-64 overflow-hidden rounded-md bg-white">
                  <div className="absolute inset-x-0 top-8 space-y-9 px-2">
                    {[30, 25, 20, 15, 10, 0].map((tick) => (
                      <div key={tick} className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="w-7 text-right">{tick === 0 ? "0" : `${tick}K`}</span>
                        <span className="h-px flex-1 border-t border-dashed border-slate-200" />
                      </div>
                    ))}
                  </div>
                  <svg className="absolute inset-x-10 bottom-8 h-44 w-[calc(100%-5rem)] overflow-visible" viewBox="0 0 420 180" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <linearGradient id="supporterLineFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#1d6fff" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#1d6fff" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0 168 C38 142 52 155 86 130 C121 104 139 122 170 92 C205 58 221 70 255 42 C291 12 315 38 348 18 C382 -2 397 8 420 0 L420 180 L0 180 Z" fill="url(#supporterLineFill)" />
                    <path d="M0 168 C38 142 52 155 86 130 C121 104 139 122 170 92 C205 58 221 70 255 42 C291 12 315 38 348 18 C382 -2 397 8 420 0" fill="none" stroke="#1d6fff" strokeLinecap="round" strokeWidth="4" />
                    <circle cx="420" cy="0" r="5" fill="#fff" stroke="#1d6fff" strokeWidth="4" />
                  </svg>
                  <div className="absolute right-7 top-12 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs shadow-sm">
                    <p className="font-black text-slate-800">24,860</p>
                    <p className="text-slate-400">Jun 17, 2026</p>
                  </div>
                  <div className="absolute bottom-2 left-14 right-8 flex justify-between text-xs font-medium text-slate-400">
                    <span>May 20</span><span>May 27</span><span>Jun 3</span><span>Jun 10</span><span>Jun 17</span>
                  </div>
                </div>
              </section>

              <section className="j-dashboard-card rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-black text-slate-950">Supporters by County</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-[0.9fr_1fr] xl:grid-cols-1 2xl:grid-cols-[0.9fr_1fr]">
                  <div className="grid h-56 place-items-center">
                    <div className="grid h-40 w-40 place-items-center rounded-full" style={{ background: "conic-gradient(#1d6fff 0 25%, #d6a200 25% 40%, #16a34a 40% 53%, #7c3aed 53% 68%, #f97316 68% 80%, #d1d5db 80% 100%)" }}>
                      <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center shadow-sm">
                        <span>
                          <span className="block text-lg font-black text-slate-950">24,860</span>
                          <span className="block text-[10px] font-bold text-slate-400">Total</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {countyBreakdown.map(([name, value, color]) => (
                      <div key={name} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-600">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                          <span className="truncate">{name}</span>
                        </span>
                        <span className="font-bold text-slate-700">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="j-dashboard-card rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-slate-950">Action Queue <span className="ml-1 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">12</span></h2>
                </div>
                <div className="mt-4 grid grid-cols-2 rounded-md border border-slate-200 bg-slate-50 p-1 text-xs font-black">
                  <button className="rounded bg-white px-3 py-2 text-blue-700 shadow-sm" type="button">Needs Action <span className="ml-1 rounded-full bg-blue-50 px-1.5 text-blue-700">12</span></button>
                  <button className="rounded px-3 py-2 text-slate-500" type="button">All Items <span className="ml-1 rounded-full bg-slate-200 px-1.5 text-slate-500">48</span></button>
                </div>
                <div className="mt-3 divide-y divide-slate-100">
                  {actionQueue.map((item) => (
                    <button key={item.label} className="flex w-full items-center justify-between gap-3 py-3 text-left" onClick={() => scrollToSection("Super Admin")} type="button">
                      <span className="flex items-center gap-3">
                        <span className={`grid h-8 w-8 place-items-center rounded-md ${
                          item.tone === "gold" ? "bg-amber-50 text-amber-700"
                            : item.tone === "emerald" ? "bg-emerald-50 text-emerald-700"
                              : item.tone === "red" ? "bg-red-50 text-red-600"
                                : item.tone === "amber" ? "bg-orange-50 text-orange-700"
                                  : "bg-blue-50 text-blue-700"
                        }`}>
                          <item.icon size={16} />
                        </span>
                        <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                      </span>
                      <span className="text-sm font-bold text-slate-600">{item.value}</span>
                    </button>
                  ))}
                </div>
                <button className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50" onClick={() => scrollToSection("Super Admin")} type="button">View All Queue <ChevronDown className="-rotate-90" size={14} /></button>
              </section>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_1.15fr_1fr]">
              <section className="j-dashboard-card rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-black text-slate-950">Campaign Progress</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-[0.72fr_1fr]">
                  <div className="grid place-items-center">
                    <div className="grid h-36 w-36 place-items-center rounded-full border-[10px] border-blue-100" style={{ borderTopColor: "#1d6fff", borderRightColor: "#1d6fff" }}>
                      <div className="text-center">
                        <p className="text-3xl font-black text-slate-950">72%</p>
                        <p className="text-xs font-semibold text-slate-500">Overall Progress</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {progressRows.map(([label, value, Icon]) => (
                      <div key={label}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
                          <span className="flex items-center gap-2"><Icon size={14} />{label}</span>
                          <span>{value}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${value}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="j-dashboard-card rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-black text-slate-950">Subscription & Payments</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="flex items-center gap-2 text-lg font-black text-slate-950"><Trophy size={18} className="text-amber-600" />Premium Plan</p>
                    <dl className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">Active</dd></div>
                      <div className="flex justify-between"><dt className="text-slate-500">Expires</dt><dd className="font-bold text-slate-700">24 Aug 2026 (71 days)</dd></div>
                      <div className="flex justify-between"><dt className="text-slate-500">Plan</dt><dd className="font-bold text-slate-700">Premium</dd></div>
                      <div className="flex justify-between"><dt className="text-slate-500">Monthly Fee</dt><dd className="font-bold text-slate-700">KES 25,000</dd></div>
                    </dl>
                  </div>
                  <div className="border-t border-slate-200 pt-4 md:border-l md:border-t-0 md:pl-4 md:pt-0">
                    <p className="text-sm font-black text-slate-950">Recent Payment</p>
                    <dl className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between"><dt className="text-slate-500">Amount</dt><dd className="font-bold text-slate-700">KES 25,000</dd></div>
                      <div className="flex justify-between"><dt className="text-slate-500">Date</dt><dd className="font-bold text-slate-700">24 May 2026</dd></div>
                      <div className="flex justify-between"><dt className="text-slate-500">Reference</dt><dd className="font-bold text-slate-700">PAY-8XJ2K7</dd></div>
                      <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">Paid</dd></div>
                    </dl>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-bold text-white hover:bg-blue-700" href={paymentUrl}><WalletCards size={16} />Make Payment</Link>
                  <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50" onClick={() => scrollToSection("Subscriptions")} type="button"><ReceiptText size={16} />View Billing</button>
                </div>
              </section>

              <div className="grid gap-5">
                <section className="j-dashboard-card rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between"><h2 className="text-base font-black text-slate-950">Live Communications</h2><button className="text-xs font-bold text-blue-700" onClick={() => scrollToSection("Communications")} type="button">View all</button></div>
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {[
                      ["Team Chat", MessageSquare, "blue"],
                      ["Voice Room", Radio, "emerald"],
                      ["Video Meeting", Video, "violet"],
                      ["Broadcast", RadioTower, "amber"],
                    ].map(([label, Icon, tone]) => (
                      <button key={String(label)} className={`rounded-lg border p-3 text-xs font-bold ${
                        tone === "emerald" ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                          : tone === "violet" ? "border-violet-100 bg-violet-50 text-violet-700"
                            : tone === "amber" ? "border-amber-100 bg-amber-50 text-amber-700"
                              : "border-blue-100 bg-blue-50 text-blue-700"
                      }`} onClick={() => scrollToSection("Communications")} type="button">
                        <Icon className="mx-auto mb-2" size={22} />
                        {String(label)}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="j-dashboard-card rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="text-base font-black text-slate-950">Quick Actions</h2>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {quickActions.map(([label, Icon, section]) => (
                      <button key={label} className="flex h-12 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-xs font-black text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700" onClick={() => scrollToSection(section)} type="button">
                        <Icon size={16} />
                        {label}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[2fr_1fr]">
              <section className="j-dashboard-card rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between"><h2 className="text-base font-black text-slate-950">Recent Activity</h2><button className="text-xs font-bold text-blue-700" onClick={() => scrollToSection("Audit Trail")} type="button">View all</button></div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-slate-200 text-xs text-slate-500"><tr><th className="py-2">Activity</th><th>Details</th><th>By</th><th>Time</th><th>Status</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentActivityRows.map(([activity, details, by, time, status]) => (
                        <tr key={`${activity}-${time}`} className="hover:bg-slate-50">
                          <td className="py-2 font-bold text-slate-700">{activity}</td>
                          <td className="text-slate-600">{details}</td>
                          <td className="text-slate-500">{by}</td>
                          <td className="text-slate-500">{time}</td>
                          <td><StatusPill label={status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="j-dashboard-card rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between"><h2 className="text-base font-black text-slate-950">Field Operations Overview</h2><button className="text-xs font-bold text-blue-700" onClick={() => scrollToSection("Field Operations")} type="button">View map</button></div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[["Wards Covered", "42 / 58"], ["Field Visits", "156"], ["Reports Submitted", "89"], ["Issues Resolved", "23"]].map(([label, value]) => (
                    <div key={label} className="rounded-md border border-slate-200 p-3">
                      <p className="text-xs font-bold text-slate-500">{label}</p>
                      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
                      <p className="text-[10px] font-semibold text-slate-400">This week</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-sm font-bold text-slate-700"><span>Polling Day Readiness</span><span>68%</span></div>
                  <div className="h-2 rounded-full bg-slate-100"><div className="h-2 w-[68%] rounded-full bg-emerald-500" /></div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Based on agents, materials, and logistics</span>
                    <button className="font-bold text-blue-700" onClick={() => scrollToSection("Reports")} type="button">View Readiness Report</button>
                  </div>
                </div>
              </section>
            </div>
            <footer className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 py-4 text-xs text-slate-500">
              <p>JUKWAA Kenya © 2026. All rights reserved.</p>
              <div className="flex flex-wrap items-center gap-8">
                <Link className="hover:text-blue-700" href="/support">Support</Link>
                <Link className="hover:text-blue-700" href="/legal">Privacy Policy</Link>
                <Link className="hover:text-blue-700" href="/legal">Terms & Service</Link>
                <ThemeToggle />
              </div>
            </footer>
          </section>

          {actionMessage ? (
            <section className="mb-6 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm font-semibold text-sky-900">
              {actionMessage}
            </section>
          ) : null}

          {commercialAccess && !commercialAccess.allowed ? (
            <section className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide">Workspace functions locked</p>
                  <p className="mt-1 text-sm leading-6 text-amber-900">{commercialAccess.reason}</p>
                  <p className="mt-1 text-xs font-semibold text-amber-800">You can login and view the workspace. Creating volunteers, inviting campaign managers, exports, AI, uploads, and meetings unlock after payment confirmation or admin approval.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white hover:bg-slate-900" href={paymentUrl}>
                    <HandCoins size={16} />
                    Pay / Confirm
                  </Link>
                  <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-amber-300 bg-white px-3 text-sm font-bold text-amber-900 hover:bg-amber-100" href="/support">
                    <ShieldCheck size={16} />
                    Request Admin Approval
                  </Link>
                </div>
              </div>
            </section>
          ) : null}

          {activeSection !== "Dashboard" ? (
            <section className="j-workspace-hero mb-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-blue-700">Active workspace</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">{activeWorkspaceFeatures.title}</h2>
                  <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">{activeWorkspaceFeatures.description}</p>
                </div>
                <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-black text-white shadow-sm hover:bg-blue-700" onClick={() => runAction(`${activeSection} primary action opened.`, activeSection)} type="button">
                  <Plus size={17} />
                  New {activeSection === "Payments & Billing" ? "Payment" : activeSection.split(" ")[0]}
                </button>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {activeWorkspaceFeatures.cards.map((card) => {
                  const title = String(card[0]);
                  const description = String(card[1]);
                  const FeatureIcon = card[2] as typeof Users;
                  return (
                    <div key={title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                          <FeatureIcon size={19} />
                        </span>
                        <span>
                          <span className="block text-base font-black text-slate-950">{title}</span>
                          <span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section id="communications" className={sectionClass("communications", "scroll-mt-24 grid gap-4 xl:grid-cols-3")}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">Solco Communications Bridge</h2>
                  <p className="text-sm text-slate-500">LiveKit meetings, campaign rooms, broadcasts, and Solco-compatible coordination for field teams.</p>
                </div>
                <ReportLink report="communication-rooms" label="Rooms" />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-sky-700">Bridge Status</p>
                  <p className="mt-1 text-lg font-bold text-sky-950">{solcoIntegration.status}</p>
                  <p className="mt-1 text-xs text-sky-800">{solcoIntegration.tokenEndpoint}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Solco Workspace</p>
                  <a className="mt-1 block truncate text-sm font-bold text-sky-700" href={solcoIntegration.workspaceUrl}>{solcoIntegration.workspaceUrl}</a>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">LiveKit Source</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">{solcoIntegration.livekitUrl}</p>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="meeting-identity">Meeting identity</label>
                <div className="mt-2 flex flex-col gap-2 md:flex-row">
                  <input
                    id="meeting-identity"
                    value={meetingIdentity}
                    onChange={(event) => setMeetingIdentity(event.target.value)}
                    className="h-11 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500"
                    placeholder="campaign-manager"
                  />
                  <button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400"
                    disabled={meetingTokenLoading}
                    onClick={() => void issueMeetingToken(communicationRooms[0].livekitRoomName)}
                    type="button"
                  >
                    <Video size={16} />
                    {meetingTokenLoading ? "Issuing" : "Issue LiveKit Token"}
                  </button>
                </div>
                {meetingTokenStatus ? <div className="mt-3 rounded-md bg-white p-3 text-sm font-semibold text-slate-700">{meetingTokenStatus}</div> : null}
                {meetingTokenError ? <div className="mt-3 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{meetingTokenError}</div> : null}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {communicationRooms.map((room) => (
                  <div key={room.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{room.title}</p>
                        <p className="text-xs text-slate-500">{room.purpose} - {room.scheduledAt}</p>
                      </div>
                      <StatusPill label={room.status} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{room.audience}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-mono">{room.livekitRoomName}</span>
                      <button className="rounded-md border border-slate-200 bg-white px-2 py-1 font-bold text-sky-700 hover:bg-sky-50" onClick={() => void issueMeetingToken(room.livekitRoomName)} type="button">
                        Request token
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Message Queue</h2>
                <ReportLink report="communication-messages" label="Messages" />
              </div>
              <div className="mt-4 space-y-3">
                {communicationMessages.map((message) => (
                  <div key={message.id} className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{message.subject}</p>
                        <p className="text-xs text-slate-500">{message.channel} - {message.audience}</p>
                      </div>
                      <StatusPill label={message.status} />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{message.sender} - {message.sentAt}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="ai-assistant" className={sectionClass("ai-assistant", "scroll-mt-24 grid gap-4 xl:grid-cols-3")}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">JUKWAA AI Campaign Assistant</h2>
                  <p className="text-sm text-slate-500">Natural-language intelligence, strategy ranking, reports, content drafts, risks, and opportunities.</p>
                </div>
                <ReportLink report="ai-recommendations" label="AI Actions" />
              </div>
              <form onSubmit={askJukwaaAi} className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="ai-question">Ask JUKWAA AI</label>
                <div className="mt-2 flex flex-col gap-2 md:flex-row">
                  <input
                    id="ai-question"
                    value={aiQuestion}
                    onChange={(event) => setAiQuestion(event.target.value)}
                    className="h-11 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500"
                    placeholder="Which polling stations need attention?"
                  />
                  <button disabled={aiLoading} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400">
                    <Brain size={16} />
                    {aiLoading ? "Thinking" : "Ask"}
                  </button>
                </div>
                {aiAnswer ? <div className="mt-3 whitespace-pre-wrap rounded-md bg-white p-3 text-sm leading-6 text-slate-700">{aiAnswer}</div> : null}
                {aiError ? <div className="mt-3 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{aiError}</div> : null}
              </form>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {aiRows.map((recommendation) => (
                  <div key={recommendation.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{recommendation.title}</p>
                        <p className="text-xs text-slate-500">{recommendation.category} - {recommendation.source}</p>
                      </div>
                      <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-bold text-sky-700">{recommendation.impactScore}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{recommendation.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">AI Content Assistant</h2>
              <div className="mt-4 space-y-3">
                {aiContentAssets.map((asset) => (
                  <div key={asset.id} className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{asset.title}</p>
                        <p className="text-xs text-slate-500">{asset.type} - {asset.audience}</p>
                      </div>
                      <StatusPill label={asset.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="campaign-finance" className={sectionClass("campaign-finance", "scroll-mt-24 grid gap-4 xl:grid-cols-3")}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Campaign Finance</h2>
                <ReportLink report="donations" label="Donations" />
              </div>
              <div className="mt-4 space-y-3">
                {donations.map((donation) => (
                  <div key={donation.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{donation.donorName}</p>
                        <p className="text-xs text-slate-500">{donation.donorType} - {donation.paymentMethod}</p>
                      </div>
                      <span className="text-sm font-bold text-sky-700">KES {donation.amountKes.toLocaleString()}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{donation.phone} - {donation.date}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Expenses and Approvals</h2>
                <ReportLink report="expenses" label="Expenses" />
              </div>
              <div className="mt-4 space-y-3">
                {expenses.map((expense) => (
                  <div key={expense.id} className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{expense.vendor}</p>
                        <p className="text-xs text-slate-500">{expense.category} - {expense.approvedBy}</p>
                      </div>
                      <StatusPill label={expense.status} />
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-950">KES {expense.amountKes.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Budget Control</h2>
                <ReportLink report="budgets" label="Budgets" />
              </div>
              <div className="mt-4 space-y-3">
                {budgetRows.map((row) => (
                  <div key={row.category} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-slate-950">{row.category}</p>
                      <span className="text-xs font-bold text-slate-500">{row.usedPercent}% used</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-sky-500" style={{ width: `${Math.min(100, row.usedPercent)}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Remaining KES {row.remaining.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="mpesa-payments" className={sectionClass("mpesa-payments", "scroll-mt-24 grid gap-4 xl:grid-cols-3")}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">M-Pesa Payment Infrastructure</h2>
                <ReportLink report="mpesa-transactions" label="Logs" />
              </div>
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-bold text-amber-900">Paybill configuration</p>
                <p className="mt-1 text-sm text-amber-800">Business number: {mpesaPaymentSetting.paybillNumber}</p>
                <p className="mt-1 text-xs text-amber-700">Set the live Paybill in secure production settings before processing real payments.</p>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Link className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-3 text-sm font-bold text-white hover:bg-slate-900" href="/payment/confirm">Confirm Payment</Link>
                <Link className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50" href="/admin/activation">Activate Workspace</Link>
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                <div className="rounded-md bg-slate-50 p-3">Account reference: <b>{mpesaPaymentSetting.accountReferenceFormat}</b></div>
                <div className="rounded-md bg-slate-50 p-3">STK Push: <b>{mpesaPaymentSetting.stkPushReady ? "Ready" : "Pending"}</b></div>
                <div className="rounded-md bg-slate-50 p-3">Paybill: <b>{mpesaPaymentSetting.paybillReady ? "Ready" : "Pending"}</b></div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Transaction Logs</h2>
              <div className="mt-4 space-y-3">
                {mpesaTransactions.map((transaction) => (
                  <div key={transaction.id} className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{transaction.purpose}</p>
                        <p className="text-xs text-slate-500">{transaction.method} - {transaction.phone}</p>
                      </div>
                      <StatusPill label={transaction.status} />
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-950">KES {transaction.amountKes.toLocaleString()}</p>
                    <p className="mt-1 font-mono text-xs text-slate-500">{transaction.accountReference}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Fundraising Campaigns</h2>
                <ReportLink report="fundraising" label="Fundraising" />
              </div>
              <div className="mt-4 space-y-3">
                {fundraisingCampaigns.map((item) => {
                  const progress = Math.round((item.raisedKes / item.goalAmountKes) * 100);
                  return (
                    <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-950">{item.title}</p>
                          <p className="text-xs text-slate-500">{item.targetDate}</p>
                        </div>
                        <StatusPill label={item.status} />
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-sky-500" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">KES {item.raisedKes.toLocaleString()} of {item.goalAmountKes.toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section id="predictive-analytics" className={sectionClass("predictive-analytics", "scroll-mt-24 grid gap-4 xl:grid-cols-3")}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Predictive Analytics</h2>
                <ReportLink report="predictive-analytics" label="Forecasts" />
              </div>
              <div className="mt-4 space-y-3">
                {predictiveInsights.map((insight) => (
                  <div key={insight.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-slate-950">{insight.metric}</p>
                      <span className="text-lg font-bold text-sky-700">{insight.estimate}/100</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{insight.label}</p>
                    <p className="mt-2 text-xs text-slate-500">{insight.caveat}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Scenario Planning</h2>
              <div className="mt-4 space-y-3">
                {scenarioPlans.map((scenario) => (
                  <div key={scenario.id} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-sm font-bold text-slate-950">{scenario.title}</p>
                    <p className="mt-1 text-xs text-slate-500">Turnout {scenario.turnoutShift > 0 ? "+" : ""}{scenario.turnoutShift}% - Volunteers +{scenario.volunteerIncrease}% - KES {scenario.additionalSpendKes.toLocaleString()}</p>
                    <p className="mt-2 text-sm text-slate-600">{scenario.projectedImpact}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Multi-Country and White Label</h2>
              <div className="mt-4 grid gap-3">
                {[
                  ["Custom domains", "jukwaakenya.co.ke active", Globe2],
                  ["Country configuration", "Election structures configurable", LandPlot],
                  ["White label", "Custom logo, colors, and domains", Building2],
                  ["Offline mobile prep", "Queue-based sync architecture", Smartphone],
                ].map(([label, value, Icon]) => (
                  <div key={String(label)} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-sky-700 shadow-sm"><Icon size={18} /></span>
                    <div>
                      <p className="text-sm font-bold text-slate-950">{String(label)}</p>
                      <p className="text-xs text-slate-500">{String(value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="document-center" className={sectionClass("document-center", "scroll-mt-24 grid gap-4 xl:grid-cols-3")}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Document Center</h2>
                <ReportLink report="documents" label="Documents" />
              </div>
              <div className="mt-4 space-y-3">
                {campaignDocuments.map((document) => (
                  <div key={document.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-bold text-slate-950">{document.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{document.category} - {document.version} - {document.permission}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Knowledge Center</h2>
              <div className="mt-4 space-y-3">
                {knowledgeArticles.map((article) => (
                  <div key={article.id} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-sm font-bold text-slate-950">{article.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{article.category} - {article.audience}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Backup and Disaster Recovery</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-md bg-slate-50 p-3">Scheduled backups prepared through managed database backups and export jobs.</div>
                <div className="rounded-md bg-slate-50 p-3">Audit retention enforced with immutable workspace logs.</div>
                <div className="rounded-md bg-slate-50 p-3">CSV/XLSX/PDF exports available from every report center.</div>
                <Link className="block rounded-md bg-sky-50 p-3 font-bold text-sky-800 hover:bg-sky-100" href="/legal">Privacy, consent, ownership, and backup policies</Link>
              </div>
            </div>
          </section>

          <section id="candidate-management" className={sectionClass("candidate-management", "scroll-mt-24 grid gap-4 xl:grid-cols-3")}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">Candidate Management System</h2>
                  <p className="text-sm text-slate-500">Candidate-owned workspace, campaign lifecycle, verification, and multi-election readiness.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white hover:bg-slate-900" href="/signup/candidate">
                    <UserCog size={15} />
                    New Candidate
                  </Link>
                  <ReportLink report="candidate-management" label="Candidates" />
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {candidateProfiles.map((candidate) => (
                  <div key={candidate.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-slate-950">{candidate.fullName}</p>
                        <p className="text-sm text-slate-500">{candidate.positionContesting} - {candidate.constituency}</p>
                      </div>
                      <StatusPill label={candidate.verificationStatus} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{candidate.biography}</p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-md bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Campaign</p>
                        <p className="mt-1 text-sm font-bold text-slate-950">{candidate.campaignName}</p>
                      </div>
                      <div className="rounded-md bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Lifecycle</p>
                        <p className="mt-1 text-sm font-bold text-slate-950">{candidate.activeStatus}</p>
                      </div>
                      <div className="rounded-md bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Primary Login</p>
                        <p className="mt-1 text-sm font-bold text-slate-950">{candidate.phoneNumber}</p>
                      </div>
                      <div className="rounded-md bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Party</p>
                        <p className="mt-1 text-sm font-bold text-slate-950">{candidate.politicalParty}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="rounded-lg border border-slate-200 p-4">
                  <h2 className="text-sm font-bold text-slate-950">Candidate Branding Center</h2>
                  <div className="mt-4 flex items-center gap-3">
                    <div
                      className="grid h-14 w-14 place-items-center rounded-lg text-xl font-bold"
                      style={{ backgroundColor: candidateBranding.campaignColors[0], color: accessibleTextColor(candidateBranding.campaignColors[0]) }}
                    >
                      {candidateBranding.logo}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-950">{candidateBranding.slogan}</p>
                      <p className="text-xs text-slate-500">Logo, candidate photo, campaign banner, colors, and social links are limited to workspace branding zones.</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {brandingReview.colorChecks.map((check) => (
                      <div key={check.color} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 p-2">
                        <div className="flex items-center gap-2">
                          <span className="j-swatch" style={{ backgroundColor: check.color }} />
                          <div>
                            <p className="text-xs font-bold text-slate-950">{check.color.toUpperCase()}</p>
                            <p className="text-xs text-slate-500">White {check.contrastOnWhite}:1 / Navy {check.contrastOnNavy}:1</p>
                          </div>
                        </div>
                        <span className={`rounded-md px-2 py-1 text-xs font-bold ${check.valid ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {check.valid ? "Approved" : "Needs contrast"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 p-3 text-xs leading-5 text-sky-900">
                    {brandingReview.rule}
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600">
                    {Object.entries(candidateBranding.socialLinks).map(([network, url]) => (
                      <div key={network} className="flex items-center justify-between rounded-md bg-slate-50 p-2">
                        <span className="font-bold capitalize text-slate-700">{network}</span>
                        <span className="truncate text-xs">{url}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Workspace Ownership</h2>
                <StatusPill label={workspaceOwnership.ownershipStatus} />
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Owner</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">{workspaceOwnership.candidate}</p>
                  <p className="mt-1 text-xs text-slate-500">Candidate cannot be deleted from their workspace.</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Secondary Owner</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">{workspaceOwnership.campaignManager}</p>
                  <p className="mt-1 text-xs text-slate-500">{workspaceOwnership.managerReplacePolicy}</p>
                </div>
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
                  <p className="text-sm font-bold text-sky-900">No Self Registration</p>
                  <p className="mt-1 text-sm text-sky-800">Access is restricted to invitation links, email invites, phone invites, or join codes.</p>
                </div>
              </div>
            </div>
          </section>

          <section id="invitations" className={sectionClass("invitations", "scroll-mt-24 grid gap-4 xl:grid-cols-3")}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Invitation System</h2>
                <div className="flex flex-wrap gap-2">
                  <Link className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white hover:bg-slate-900" href="/signup/user">
                    <Plus size={15} />
                    Add User
                  </Link>
                  <ReportLink report="invitations" label="Invites" />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {invitations.map((invite) => (
                  <div key={invite.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{invite.invitedName}</p>
                        <p className="text-xs text-slate-500">{invite.role} - {invite.invitedPhone}</p>
                      </div>
                      <StatusPill label={invite.status} />
                    </div>
                    <p className="mt-2 font-mono text-xs text-slate-500">{invite.invitationCode} - expires {invite.expiryDate}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Election Management</h2>
                <StatusPill label={`${governanceSummary.activeCampaigns} Active`} />
              </div>
              <div className="mt-4 space-y-3">
                {electionCycles.map((election) => (
                  <div key={election.id} className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{election.electionName}</p>
                        <p className="text-xs text-slate-500">{election.electionType} - {election.country}</p>
                      </div>
                      <StatusPill label={election.status} />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{election.electionDate}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Phone-First Authentication</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white hover:bg-slate-900" href="/login">
                  <KeyRound size={15} />
                  Login
                </Link>
                <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 text-sm font-bold text-red-700 hover:bg-red-50" onClick={() => void logout()} type="button">
                  <X size={15} />
                  Logout
                </button>
              </div>
              <div className="mt-4 grid gap-3">
                {[
                  ["Primary", "Phone number + password", Smartphone],
                  ["Secondary", "Email + password", KeyRound],
                  ["Future-ready", "OTP authentication", ShieldCheck],
                ].map(([label, value, Icon]) => (
                  <div key={String(label)} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-sky-700 shadow-sm">
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{String(label)}</p>
                      <p className="text-sm font-bold text-slate-950">{String(value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="workspace-governance" className={sectionClass("workspace-governance", "scroll-mt-24 grid gap-4 xl:grid-cols-3")}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">Campaign Team Structure</h2>
                  <p className="text-sm text-slate-500">Candidate-owned hierarchy from campaign manager down to polling agents.</p>
                </div>
                <ReportLink report="team-hierarchy" label="Hierarchy" />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {hierarchyRows.map((node) => (
                  <div key={node.level} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-bold text-sky-700">{node.level}</span>
                      <StatusPill label={node.status} />
                    </div>
                    <p className="mt-3 text-sm font-bold text-slate-950">{node.role}</p>
                    <p className="text-xs text-slate-500">{node.name}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">Reports to {node.reportsTo}</p>
                    <p className="mt-3 text-lg font-bold text-slate-950">{node.members}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">User Approval Workflow</h2>
              <div className="mt-4 grid gap-3">
                {["Approve User", "Suspend User", "Deactivate User", "Reactivate User"].map((action) => (
                  <button key={action} className="flex h-11 items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800" onClick={() => void persistWorkflow("userStatus", { invitationId: invitations.find((invite) => invite.status === "Pending")?.id, status: action.includes("Approve") ? "Accepted" : action.includes("Reactivate") ? "Pending" : "Revoked" }, `${action} workflow saved to the audit trail.`, "Users")} type="button">
                    {action}
                    <UserCheck size={16} />
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">Campaign Manager approval is required for non-owner workspace users.</p>
            </div>
          </section>

          <section id="subscriptions" className={sectionClass("subscriptions", "scroll-mt-24 grid gap-4 xl:grid-cols-3")}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Subscription Management</h2>
                <ReportLink report="subscription" label="Plan" />
              </div>
              <div className="mt-4 rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Current Plan</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{workspaceSubscription.plan}</p>
                <p className="mt-1 text-sm text-slate-500">{workspaceSubscription.startDate} to {workspaceSubscription.expiryDate}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-white p-2"><b>{workspaceSubscription.userLimit}</b><br />users</div>
                  <div className="rounded-md bg-white p-2"><b>{workspaceSubscription.volunteerLimit}</b><br />volunteers</div>
                  <div className="rounded-md bg-white p-2"><b>{workspaceSubscription.pollingAgentLimit}</b><br />agents</div>
                  <div className="rounded-md bg-white p-2"><b>{workspaceSubscription.storageGb}GB</b><br />storage</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Feature Entitlements</h2>
              <div className="mt-4 space-y-2">
                {[
                  ["AI Access", featureEntitlements.aiAccess ? "Enabled" : "Locked"],
                  ["SMS Access", featureEntitlements.smsAccess ? "Enabled" : "Locked"],
                  ["WhatsApp Access", featureEntitlements.whatsappAccess ? "Enabled" : "Locked"],
                  ["Polling Agents", `${featureEntitlements.pollingAgentLimit} limit`],
                  ["Storage", `${featureEntitlements.storageLimitGb}GB limit`],
                  ["Users", `${featureEntitlements.userLimit} limit`],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-center justify-between rounded-md bg-slate-50 p-3">
                    <span className="text-sm font-semibold text-slate-700">{String(label)}</span>
                    <span className="text-xs font-bold text-sky-700">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Payment Infrastructure</h2>
                <ReportLink report="payments" label="Payments" />
              </div>
              <div className="mt-4 space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{payment.method}</p>
                        <p className="text-xs text-slate-500">{payment.reference}</p>
                      </div>
                      <StatusPill label={payment.status} />
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-950">KES {payment.amountKes.toLocaleString()}</p>
                  </div>
                ))}
                <p className="text-xs text-slate-500">{invoices.length} invoices tracked. Payment processors are framework-only until live billing is enabled.</p>
              </div>
            </div>
          </section>

          <section id="audit-trail" className={sectionClass("audit-trail", "scroll-mt-24 grid gap-4 xl:grid-cols-3")}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Security Hardening</h2>
                <ReportLink report="security-events" label="Security" />
              </div>
              <div className="mt-4 space-y-3">
                {securityEvents.map((event) => (
                  <div key={event.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{event.event}</p>
                        <p className="text-xs text-slate-500">{event.user} - {event.device}</p>
                      </div>
                      <span className="font-mono text-xs text-slate-500">{event.ipAddress}</span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{event.createdAt}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">JUKWAA Super Admin Portal</h2>
                  <p className="text-sm text-slate-500">Owner dashboard for candidates, workspaces, subscriptions, support tickets, and usage statistics.</p>
                </div>
                <ReportLink report="governance-summary" label="Governance" />
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                <Link className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-3 text-sm font-bold text-white hover:bg-slate-900" href="/admin/saas">SaaS Console</Link>
                <Link className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50" href="/admin/activation">Manual Activation</Link>
                <Link className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50" href="/support">Support Contacts</Link>
                <Link className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50" href="/legal">Legal Policies</Link>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Workspaces", platformMetrics.workspaces],
                  ["Candidates", platformMetrics.candidates],
                  ["Active Subs", platformMetrics.activeSubscriptions],
                  ["MRR KES", platformMetrics.monthlyRecurringRevenue.toLocaleString()],
                  ["Active Users", platformMetrics.activeUsers],
                  ["Total Users", platformMetrics.totalUsers],
                  ["Usage", `${platformMetrics.usagePercent}%`],
                  ["Support Tickets", platformMetrics.supportTickets],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{String(label)}</p>
                    <p className="mt-2 text-xl font-bold text-slate-950">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="super-admin" className={sectionClass("super-admin", "scroll-mt-24 grid gap-4 xl:grid-cols-3")}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">Election Operations Command Center</h2>
                  <p className="text-sm text-slate-500">Live agent status, turnout, incident escalation, form quality, and PVT coverage.</p>
                </div>
                <ReportLink report="situation-room-summary" label="Summary" />
              </div>
              <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Station</th>
                      <th className="px-4 py-3">Agent</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Turnout</th>
                      <th className="px-4 py-3">Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {agentRows.map((row) => (
                      <tr key={row.station}>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-950">{row.station}</p>
                          <p className="text-xs text-slate-500">{row.ward}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{row.agent}</td>
                        <td className="px-4 py-3"><StatusPill label={row.status} /></td>
                        <td className="px-4 py-3 font-bold text-sky-700">{row.turnout}%</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-md px-2 py-1 text-xs font-bold ${row.health === "Green" ? "bg-emerald-50 text-emerald-700" : row.health === "Amber" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>{row.health}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Situation Room Alerts</h2>
                <ReportLink report="incident" label="Incidents" />
              </div>
              <div className="mt-4 space-y-3">
                {electionAlerts.map((alert) => (
                  <div key={alert.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{alert.title}</p>
                        <p className="text-xs text-slate-500">{alert.alertType} - {alert.pollingStation}</p>
                      </div>
                      <StatusPill label={alert.severity} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{alert.body}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{alert.createdAt} - {alert.status}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="turnout-monitoring" className={sectionClass("turnout-monitoring", "scroll-mt-24 grid gap-4 xl:grid-cols-4")}>
            <ChartCard title="Turnout Monitoring">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={turnoutRows}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="interval" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="percentage" stroke="#0ea5e9" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="PVT Running Totals">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pvtRows}>
                  <XAxis dataKey="candidate" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="votes" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Mobilization Signal">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mobilizationRows} layout="vertical" margin={{ left: 34 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="station" type="category" width={108} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="conversionSignal" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Mobile Agent Actions</h2>
              <div className="mt-4 grid gap-3">
                {[
                  ["Check In", RadioTower],
                  ["Submit Turnout", Activity],
                  ["Report Incident", Siren],
                  ["Upload Form", UploadCloud],
                  ["Enter Result", BadgeCheck],
                ].map(([label, Icon]) => (
                  <button key={String(label)} className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-sm font-bold text-slate-800 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800" onClick={() => void persistWorkflow(String(label) === "Enter Result" ? "result" : String(label) === "Submit Turnout" ? "result" : "supportTicket", String(label) === "Enter Result" || String(label) === "Submit Turnout" ? { candidateName: campaign.candidateName, votes: 0, totalVotes: 0, rejectedVotes: 0 } : { title: String(label), description: "Election operation action from mobile agent panel.", priority: String(label).includes("Incident") ? "Critical" : "Medium" }, `${String(label)} workflow saved.`, "Election Operations")} type="button">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-sky-700 shadow-sm">
                      <Icon size={18} />
                    </span>
                    {String(label)}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section id="election-operations" className={sectionClass("election-operations", "scroll-mt-24 grid gap-4 xl:grid-cols-3")}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Incident Command Center</h2>
                <ReportLink report="incident" label="Incident Report" />
              </div>
              <div className="mt-4 space-y-3">
                {electionIncidents.map((incident) => (
                  <div key={incident.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{incident.title}</p>
                        <p className="text-xs text-slate-500">{incident.category} - {incident.pollingStation}</p>
                      </div>
                      <StatusPill label={incident.urgency} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{incident.description}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{incident.status} - {incident.assignedTo} - {incident.photos} photos / {incident.videos} videos</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Forms and Validation</h2>
                <ReportLink report="results" label="Results" />
              </div>
              <div className="mt-4 space-y-3">
                {electionForms.map((form) => (
                  <div key={form.id} className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{form.pollingStation}</p>
                        <p className="text-xs text-slate-500">{form.formType} - {form.uploadedBy}</p>
                      </div>
                      <StatusPill label={form.qualityStatus} />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{form.duplicateCheck} - {form.missingFields.length ? form.missingFields.join(", ") : "All required fields present"}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">PVT Quality Queue</h2>
                <ReportLink report="pvt" label="PVT" />
              </div>
              <div className="mt-4 space-y-3">
                {qualityQueue.map((item) => (
                  <div key={`${item.station}-${item.formType}`} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{item.station}</p>
                        <p className="text-xs text-slate-500">{item.formType} - {item.uploadedBy}</p>
                      </div>
                      <StatusPill label={item.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{item.flags}</p>
                  </div>
                ))}
                {qualityQueue.length === 0 ? <div className="rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">All submitted forms are verified.</div> : null}
              </div>
            </div>
          </section>

          <section id="results-center" className={sectionClass("results-center", "scroll-mt-24 grid gap-4 xl:grid-cols-3")}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">Results Center</h2>
                  <p className="text-sm text-slate-500">Parallel Vote Tabulation by polling station with verification state.</p>
                </div>
                <ReportLink report="election-day-performance" label="Performance" />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {pollingResults.map((result) => (
                  <div key={result.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-bold text-slate-950">{result.candidate}</p>
                    <p className="text-xs text-slate-500">{result.pollingStation}</p>
                    <p className="mt-3 text-2xl font-bold text-slate-950">{result.votes.toLocaleString()}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{result.totalVotes.toLocaleString()} total votes - {result.rejectedVotes} rejected</p>
                    <div className="mt-3"><StatusPill label={result.verificationStatus} /></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Campaign Intelligence Center</h2>
              <div className="mt-4 space-y-3">
                {mobilizationRows.slice(0, 5).map((row) => (
                  <div key={row.station} className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{row.station}</p>
                        <p className="text-xs text-slate-500">{row.ward} - {row.strongSupporters} strong supporters</p>
                      </div>
                      <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-sky-700">{row.turnoutPercentage}%</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{row.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-4">
            <ChartCard title="Volunteer Performance">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volunteerRows.slice(0, 5)} layout="vertical" margin={{ left: 32 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={106} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
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
                  <Line type="monotone" dataKey="actual" stroke="#0ea5e9" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Community Issues Breakdown">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={issueBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={86} paddingAngle={2}>
                    {issueBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={["#0ea5e9", "#475569", "#94a3b8", "#cbd5e1", "#64748b"][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section id="territory-coverage" className={sectionClass("territory-coverage", "scroll-mt-24 grid gap-4 xl:grid-cols-3")}>
            <ChartCard title="Supporters by Ward">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wardData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
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
                  <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
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

          <section id="supporters" className={sectionClass("supporters", "scroll-mt-24 grid gap-4 2xl:grid-cols-[1.5fr_0.8fr]")}>
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
                  <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Phone number
                  <input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Support level
                  <select className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500">
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
                <button disabled={duplicate && !overrideDuplicate} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300" onClick={() => void persistWorkflow("supporter", { fullName: name, phoneNumber: phone, supportLevel: "Unknown", consentToContact: true, notes: overrideDuplicate ? "Duplicate override approved." : "" }, `${name.trim() || "Supporter"} saved.`, "Supporters")} type="button">
                  <Plus size={16} />
                  Save Supporter
                </button>
              </div>
            </div>
          </section>

          <section id="polling-stations" className={sectionClass("polling-stations", "scroll-mt-24 rounded-lg border border-slate-200 bg-white shadow-sm")}>
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
                    <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
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

          <section id="volunteers" className={sectionClass("volunteers", "scroll-mt-24 grid gap-4 2xl:grid-cols-[1.2fr_0.9fr]")}>
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
                          <td className="px-4 py-3 font-bold text-sky-700">{row.score}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div id="field-operations" className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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
                  <button key={String(label)} className="flex min-h-20 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left text-sm font-bold text-slate-800 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800" onClick={() => void persistWorkflow(String(label) === "Register Supporter" ? "supporter" : String(label) === "Submit Issue" ? "issue" : String(label) === "Submit Field Visit" ? "fieldVisit" : String(label) === "Complete Task" ? "task" : String(label) === "Report Intelligence" ? "supportTicket" : "supportTicket", String(label) === "Register Supporter" ? { fullName: "New supporter", phoneNumber: `+2547${Math.floor(10000000 + Math.random() * 89999999)}`, supportLevel: "Unknown", consentToContact: true } : String(label) === "Submit Issue" ? { title: "New community issue", category: "Other", priority: "Medium" } : String(label) === "Submit Field Visit" ? { visitPurpose: "Field activity", supportersEngaged: 0 } : String(label) === "Complete Task" ? { title: "Follow-up task", dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) } : { title: String(label), description: "Submitted from field action panel.", priority: "Medium" }, `${String(label)} saved.`, "Field Operations")} type="button">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-sky-700 shadow-sm">
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

          <section id="community-issues" className={sectionClass("community-issues", "scroll-mt-24 grid gap-4 xl:grid-cols-3")}>
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

            <div id="events-rallies" className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Volunteer Leaderboard</h2>
              <div className="mt-4 space-y-3">
                {volunteerRows.slice(0, 5).map((row, index) => (
                  <div key={row.name} className="flex items-center gap-3 rounded-md bg-slate-50 p-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-950 text-sm font-bold text-white">
                      {index === 0 ? <Trophy size={18} /> : index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-950">{row.name}</p>
                      <p className="text-xs text-slate-500">{row.supportersRegistered} supporters - {row.issuesSubmitted} issues - {row.eventsAttended} events</p>
                    </div>
                    <span className="text-sm font-bold text-sky-700">{row.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-3">
            <div id="ground-intelligence" className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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

          <section id="reports" className={sectionClass("reports", "scroll-mt-24 grid gap-4 xl:grid-cols-3")}>
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

          <section id="users" className={sectionClass("users", "scroll-mt-24 grid gap-4 xl:grid-cols-3")}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Campaign Setup Wizard</h2>
              <div className="mt-4 space-y-3">
                {["Create Campaign", "Candidate Information", "Branding", "Create Admin User", "Launch Workspace"].map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${index < 4 ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-500"}`}>{index + 1}</div>
                    <span className="text-sm font-semibold text-slate-700">{step}</span>
                  </div>
                ))}
              </div>
              <label className="mt-5 block text-sm font-semibold text-slate-700">
                Party affiliation at signup
                <select value={selectedParty} onChange={(event) => setSelectedParty(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500">
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
                    <span className="text-xs font-bold text-sky-700">{user.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Audit Trail</h2>
              <div className="mt-4 space-y-3">
                {auditTrail.map((event) => (
                  <div key={`${event.user}-${event.timestamp}`} className="border-l-2 border-sky-500 pl-3">
                    <p className="text-sm font-bold text-slate-950">{event.action} - {event.module}</p>
                    <p className="text-xs text-slate-500">{event.user} at {event.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="locations" className={sectionClass("locations", "scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4 shadow-sm")}>
            <h2 className="text-sm font-bold text-slate-950">Reusable Location Hierarchy and Report Catalog</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Country {"->"} County {"->"} Constituency {"->"} Ward {"->"} Village {"->"} Polling Station</div>
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Role geography assignment supports constituency, ward, village, and station scoping.</div>
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">{roles.length} built-in roles mapped for campaign operations.</div>
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">{reportRows("key-issues-analysis").length} report groups available for export.</div>
            </div>
          </section>

          <section id="knowledge-center" className={sectionClass("knowledge-center", "scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4 shadow-sm")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-950">Kenya Political Party Register</h2>
                <p className="text-sm text-slate-500">ORPP fully registered parties, May 2026. Signup also includes Independent Candidate above the party list.</p>
              </div>
              <span className="rounded-md bg-sky-50 px-3 py-1 text-sm font-bold text-sky-700">{politicalParties.length} registered parties</span>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {partyAffiliationOptions.slice(0, 17).map((option) => (
                <div key={option.id} className={`rounded-md border p-3 text-sm ${option.affiliationType === "Independent" || option.party?.featuredRank ? "border-sky-200 bg-sky-50 text-sky-900" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                  <p className="font-bold">{option.displayName}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {option.affiliationType === "Independent" ? "Signup option" : `Register #${option.party?.registerSerial}${option.party?.featuredRank ? ` - Featured ${option.party.featuredRank}` : ""}`}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section id="candidate-geography" className={sectionClass("candidate-geography", "scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4 shadow-sm")}>
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
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-sky-700">{scope.geographyLevel}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{scope.description}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">Source: {kenyaGeographySummary.source}. The raw constituency area text is preserved in the JUKWAA data platform for auditability.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
