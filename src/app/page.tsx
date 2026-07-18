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
import { constituenciesForCounty, countyForConstituency, kenyaCounties, wardsForConstituency, wardsForCounty, wardsForKenya } from "@/lib/kenya-geography";
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
  campaign,
  communicationMessages,
  communicationRooms,
  candidatePositionScopes,
  aiContentAssets,
  groupCount,
  candidateBranding,
  featureEntitlements,
  kenyaGeographySummary,
  partyAffiliationOptions,
  politicalParties,
  solcoIntegration,
  platformWorkspaceMetrics,
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

const roleNavItems: Record<string, string[]> = {
  Candidate: ["Dashboard", "Supporters", "Volunteers", "Polling Agents", "Tasks & Field Ops", "Events", "Communications", "Issues & Manifesto", "Reports & Analytics", "AI Campaign Studio", "Payments & Billing", "Team & Roles", "Settings"],
  Admin: ["Dashboard", "Supporters", "Volunteers", "Polling Agents", "Tasks & Field Ops", "Events", "Communications", "Issues & Manifesto", "Reports & Analytics", "AI Campaign Studio", "Payments & Billing", "Team & Roles", "Settings"],
  "Campaign Manager": ["Dashboard", "Supporters", "Volunteers", "Polling Agents", "Tasks & Field Ops", "Events", "Communications", "Issues & Manifesto", "Reports & Analytics", "AI Campaign Studio", "Team & Roles"],
  "Constituency Coordinator": ["Dashboard", "Supporters", "Volunteers", "Tasks & Field Ops", "Events", "Communications", "Issues & Manifesto", "Reports & Analytics"],
  "Ward Coordinator": ["Dashboard", "Supporters", "Volunteers", "Tasks & Field Ops", "Events", "Communications", "Issues & Manifesto", "Reports & Analytics"],
  "Village Coordinator": ["Dashboard", "Supporters", "Tasks & Field Ops", "Events", "Communications", "Issues & Manifesto"],
  Volunteer: ["Dashboard", "Supporters", "Tasks & Field Ops", "Events", "Communications", "Issues & Manifesto"],
  "Polling Agent": ["Dashboard", "Polling Agents", "Tasks & Field Ops", "Communications", "Reports & Analytics"],
  "Media Team": ["Dashboard", "Communications", "AI Campaign Studio", "Events", "Reports & Analytics"],
  "Data Clerk": ["Dashboard", "Supporters", "Polling Agents", "Reports & Analytics", "Tasks & Field Ops"],
};

const roleProfiles: Record<string, { title: string; subtitle: string; badge: string; gradient: string; quickActions: Array<[string, typeof Users, string]> }> = {
  Candidate: {
    title: "Candidate Command Center",
    subtitle: "Own the whole campaign: supporters, field teams, events, finance, messaging, and election readiness.",
    badge: "Owner",
    gradient: "from-amber-50 via-white to-blue-50",
    quickActions: [["Add Supporter", Users, "Supporters"], ["Invite Team", UsersRound, "Team & Roles"], ["Create Event", CalendarDays, "Events"], ["Ask AI", Brain, "AI Campaign Studio"]],
  },
  Admin: {
    title: "Admin Control Center",
    subtitle: "Manage access, billing, approvals, reports, and workspace health for the campaign.",
    badge: "Admin",
    gradient: "from-slate-50 via-white to-sky-50",
    quickActions: [["Invite Team", UsersRound, "Team & Roles"], ["Reports", BarChart3, "Reports & Analytics"], ["Settings", Settings, "Settings"], ["Audit", ShieldCheck, "Audit Trail"]],
  },
  "Campaign Manager": {
    title: "Campaign Manager Workbench",
    subtitle: "Coordinate teams, tasks, events, supporter operations, communications, and daily execution.",
    badge: "Manager",
    gradient: "from-blue-50 via-white to-emerald-50",
    quickActions: [["Create Task", CheckCircle2, "Tasks & Field Ops"], ["Add Volunteer", UserCheck, "Volunteers"], ["Create Event", CalendarDays, "Events"], ["Communicate", MessageSquare, "Communications"]],
  },
  "Constituency Coordinator": {
    title: "Constituency Operations Desk",
    subtitle: "Track constituency supporter coverage, volunteers, issues, events, and field follow-up.",
    badge: "Constituency",
    gradient: "from-emerald-50 via-white to-sky-50",
    quickActions: [["Register Supporter", Users, "Supporters"], ["Create Task", CheckCircle2, "Tasks & Field Ops"], ["Report Issue", Siren, "Issues & Manifesto"], ["Reports", BarChart3, "Reports & Analytics"]],
  },
  "Ward Coordinator": {
    title: "Ward Coordinator Desk",
    subtitle: "Run ward-level supporter registration, volunteer follow-up, issues, events, and reporting.",
    badge: "Ward",
    gradient: "from-emerald-50 via-white to-amber-50",
    quickActions: [["Register Supporter", Users, "Supporters"], ["Field Task", Navigation, "Tasks & Field Ops"], ["Report Issue", AlertTriangle, "Issues & Manifesto"], ["Communicate", MessageSquare, "Communications"]],
  },
  "Village Coordinator": {
    title: "Village Mobilization Desk",
    subtitle: "Capture ground intelligence, register supporters, report issues, and coordinate local turnout.",
    badge: "Village",
    gradient: "from-lime-50 via-white to-sky-50",
    quickActions: [["Register Supporter", Users, "Supporters"], ["Field Visit", Navigation, "Tasks & Field Ops"], ["Report Issue", AlertTriangle, "Issues & Manifesto"], ["Event", CalendarDays, "Events"]],
  },
  Volunteer: {
    title: "Volunteer Field App",
    subtitle: "Register supporters, submit visits, report issues, view tasks, and support events from the ground.",
    badge: "Volunteer",
    gradient: "from-sky-50 via-white to-lime-50",
    quickActions: [["Register Supporter", Users, "Supporters"], ["Submit Field Visit", Navigation, "Tasks & Field Ops"], ["Report Issue", AlertTriangle, "Issues & Manifesto"], ["Events", CalendarDays, "Events"]],
  },
  "Polling Agent": {
    title: "Polling Agent Station Desk",
    subtitle: "Check station readiness, submit turnout/results, escalate incidents, and follow election-day instructions.",
    badge: "Agent",
    gradient: "from-red-50 via-white to-amber-50",
    quickActions: [["Polling Desk", RadioTower, "Polling Agents"], ["Submit Result", BadgeCheck, "Turnout Monitoring"], ["Report Incident", Siren, "Polling Agents"], ["Messages", MessageSquare, "Communications"]],
  },
  "Media Team": {
    title: "Media & Communications Studio",
    subtitle: "Prepare broadcasts, AI-assisted content, event messaging, and communication queues.",
    badge: "Media",
    gradient: "from-violet-50 via-white to-sky-50",
    quickActions: [["Broadcasts", RadioTower, "Communications"], ["AI Content", Brain, "AI Campaign Studio"], ["Events", CalendarDays, "Events"], ["Reports", BarChart3, "Reports & Analytics"]],
  },
  "Data Clerk": {
    title: "Data Entry & Reports Desk",
    subtitle: "Clean records, enter supporters and results, export reports, and maintain campaign data quality.",
    badge: "Data",
    gradient: "from-slate-50 via-white to-emerald-50",
    quickActions: [["Add Supporter", Users, "Supporters"], ["Enter Result", BadgeCheck, "Turnout Monitoring"], ["Reports", BarChart3, "Reports & Analytics"], ["Tasks", CheckCircle2, "Tasks & Field Ops"]],
  },
};

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
  "Team & Roles": "invitations",
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
    candidateId: string;
    role: string;
    isPlatformAdmin: boolean;
    member?: {
      id?: string;
      full_name?: string | null;
      email?: string | null;
      phone_number?: string | null;
      role?: string | null;
      status?: string | null;
      county_name?: string | null;
      constituency_name?: string | null;
      ward_name?: string | null;
      village_name?: string | null;
      polling_station_name?: string | null;
    } | null;
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
    county?: string;
    constituency?: string;
    ward?: string;
    election_year?: string;
    slogan?: string;
    active_status?: string;
  } | null;
  summary: {
    supporters: number;
    volunteers: number;
    pollingAgents?: number;
    tasks?: number;
    tasksCompleted?: number;
    tasksOverdue?: number;
    issues: number;
    events: number;
    payments: number;
    invitations: number;
    unreadNotifications?: number;
    messagesOpen?: number;
    aiContent?: number;
  };
  livekit?: {
    configured: boolean;
    urlLabel: string;
  };
  ai?: {
    configured: boolean;
  };
  solcoIntegration?: {
    workspace_url?: string;
    livekit_url_label?: string;
    token_endpoint?: string;
    meeting_path?: string;
    status?: string;
  } | null;
  supporters: Array<{
    id: string;
    full_name: string;
    phone_number: string;
    support_level: SupportLevel;
    key_issue: string | null;
    volunteer_interest: boolean;
    gender?: string | null;
    age_group?: string | null;
    county_name?: string | null;
    constituency_name?: string | null;
    ward_name?: string | null;
    village_name?: string | null;
    polling_station_name?: string | null;
    created_at: string;
  }>;
  volunteers?: LiveRecord[];
  pollingAgents?: LiveRecord[];
  tasks?: LiveRecord[];
  fieldVisits?: LiveRecord[];
  issues?: LiveRecord[];
  events?: LiveRecord[];
  notifications?: LiveRecord[];
  communicationRooms?: LiveRecord[];
  communicationMessages?: LiveRecord[];
  aiContentAssets?: LiveRecord[];
  auditLogs?: LiveRecord[];
  invitations?: LiveRecord[];
  pollingResults?: LiveRecord[];
};

type LiveRecord = Record<string, unknown>;

type LiveSupporter = {
  id: string;
  fullName: string;
  phoneNumber: string;
  county: string;
  constituency: string;
  ward: string;
  pollingStation: string;
  supportLevel: SupportLevel;
  keyIssue: string;
  volunteerInterest: boolean;
  gender: string;
  ageGroup: string;
};

type ElectoralFocusArea = {
  label: string;
  chartName: string;
  level: "country" | "county" | "constituency" | "ward" | "local" | "pollingStation";
  countyName: string;
  constituencyName: string;
  wardName: string;
  localName?: string;
  pollingStationName?: string;
};

function normalizeSupporter(record: LiveBootstrap["supporters"][number]): LiveSupporter {
  return {
    id: record.id,
    fullName: record.full_name,
    phoneNumber: record.phone_number,
    county: record.county_name || "Not assigned",
    constituency: record.constituency_name || "Not assigned",
    ward: record.ward_name || "Not assigned",
    pollingStation: record.polling_station_name || record.village_name || "Not assigned",
    supportLevel: record.support_level,
    keyIssue: record.key_issue || "Not recorded",
    volunteerInterest: record.volunteer_interest,
    gender: record.gender || "Not recorded",
    ageGroup: record.age_group || "Not recorded",
  };
}

function liveText(record: LiveRecord | undefined, key: string, fallback = "Not recorded") {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function liveNumber(record: LiveRecord | undefined, key: string, fallback = 0) {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function liveDate(record: LiveRecord | undefined, key: string, fallback = "") {
  const value = record?.[key];
  if (typeof value !== "string" || !value) return fallback;
  return value.slice(0, 16).replace("T", " ");
}

function readableNameFromContact(value?: string | null) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.includes("@")) {
    const localPart = trimmed.split("@")[0] ?? "";
    return localPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }
  return trimmed;
}

function emptyState(message: string) {
  return <div className="rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-500">{message}</div>;
}

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

function ChartCard({
  title,
  children,
  report = "supporters-by-area",
  insight,
  stats = [],
  hasData = true,
  accent = "sky",
}: {
  title: string;
  children: React.ReactNode;
  report?: string;
  insight?: string;
  stats?: Array<{ label: string; value: string | number }>;
  hasData?: boolean;
  accent?: "sky" | "amber" | "emerald" | "violet" | "red";
}) {
  const mounted = useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot);
  const [open, setOpen] = useState(false);
  const accentClasses = {
    sky: "from-sky-50 to-blue-50 text-sky-700 border-sky-100",
    amber: "from-amber-50 to-yellow-50 text-amber-700 border-amber-100",
    emerald: "from-emerald-50 to-teal-50 text-emerald-700 border-emerald-100",
    violet: "from-violet-50 to-fuchsia-50 text-violet-700 border-violet-100",
    red: "from-red-50 to-rose-50 text-red-700 border-red-100",
  }[accent];

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className={`mx-4 mt-4 inline-flex rounded-full border bg-gradient-to-r px-3 py-1 text-xs font-black ${accentClasses}`}>{title}</div>
        <button
          className="mr-4 mt-4 rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-label={`${open ? "Hide" : "Show"} details for ${title}`}
          type="button"
        >
          <ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      <div className="mx-4 h-64 min-w-0">
        {mounted && hasData ? children : (
          <div className={`flex h-full flex-col justify-center rounded-lg border bg-gradient-to-br p-5 ${accentClasses}`}>
            <p className="text-sm font-black">No live records yet</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Add supporters, volunteers, events, issues, or field visits and this panel will light up with live workspace intelligence.</p>
          </div>
        )}
      </div>
      {open ? (
        <div className="mt-4 border-t border-slate-200 bg-slate-50/80 p-4">
          {insight ? <p className="text-sm leading-6 text-slate-700">{insight}</p> : null}
          {stats.length ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-md border border-white bg-white p-3 shadow-sm">
                  <p className="text-lg font-black text-slate-950">{stat.value}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {(["csv", "xlsx", "pdf"] as const).map((format) => (
              <a key={format} href={`/api/reports/export?format=${format}&report=${report}`} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-black uppercase text-slate-700 hover:border-sky-200 hover:text-sky-700">
                {format}
              </a>
            ))}
          </div>
        </div>
      ) : null}
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
      href={`/api/reports/export?format=${type}&report=supporters-by-area`}
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
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [supportLevel, setSupportLevel] = useState<SupportLevel>("Unknown");
  const [supporterWard, setSupporterWard] = useState("");
  const [supporterVillage, setSupporterVillage] = useState("");
  const [supporterPollingStation, setSupporterPollingStation] = useState("");
  const [supporterKeyIssue, setSupporterKeyIssue] = useState("");
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
  const [roomTitle, setRoomTitle] = useState("");
  const [roomAudience, setRoomAudience] = useState("");
  const [roomPurpose, setRoomPurpose] = useState("Command Briefing");
  const [roomSchedule, setRoomSchedule] = useState("");
  const [roomParticipants, setRoomParticipants] = useState("0");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageRecipients, setMessageRecipients] = useState("");
  const [messageAudience, setMessageAudience] = useState("");
  const [messageChannel, setMessageChannel] = useState("Campaign Chat");
  const [messageStatus, setMessageStatus] = useState("Draft");
  const [messageSending, setMessageSending] = useState(false);
  const [messageDeliveryNotice, setMessageDeliveryNotice] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventAttendance, setEventAttendance] = useState("0");
  const [issueTitle, setIssueTitle] = useState("");
  const [issueCategory, setIssueCategory] = useState("Other");
  const [issuePriority, setIssuePriority] = useState("Medium");
  const [issueDescription, setIssueDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [liveBootstrap, setLiveBootstrap] = useState<LiveBootstrap | null>(null);
  const [liveSupporters, setLiveSupporters] = useState<LiveSupporter[] | null>(null);
  const platformMetrics = platformWorkspaceMetrics();
  const brandingReview = useMemo(() => validateWorkspaceBranding(candidateBranding), []);

  const workspaceSupporters = liveSupporters ?? [];
  const liveVolunteers = liveBootstrap?.volunteers ?? [];
  const livePollingAgents = liveBootstrap?.pollingAgents ?? [];
  const liveTasks = liveBootstrap?.tasks ?? [];
  const liveFieldVisits = liveBootstrap?.fieldVisits ?? [];
  const liveIssues = liveBootstrap?.issues ?? [];
  const liveEvents = liveBootstrap?.events ?? [];
  const liveNotifications = liveBootstrap?.notifications ?? [];
  const liveRooms = liveBootstrap?.communicationRooms ?? [];
  const liveMessages = liveBootstrap?.communicationMessages ?? [];
  const liveAiAssets = liveBootstrap?.aiContentAssets ?? [];
  const liveAuditLogs = liveBootstrap?.auditLogs ?? [];
  const livePollingResults = liveBootstrap?.pollingResults ?? [];
  const usingLiveData = true;
  const campaignCounty = liveBootstrap?.campaign?.county || campaign.county;
  const campaignConstituency = liveBootstrap?.campaign?.constituency || campaign.constituency;
  const campaignWard = liveBootstrap?.campaign?.ward || "";
  const campaignPosition = liveBootstrap?.campaign?.position_targeted || campaign.positionTargeted;
  const campaignSlogan = liveBootstrap?.campaign?.slogan || candidateBranding.slogan;
  const commercialAccess = liveBootstrap?.workspace.access;
  const currentMember = liveBootstrap?.workspace.member;
  const referenceCandidateName = liveBootstrap?.campaign?.candidate_name || "Campaign Owner";
  const currentRole = liveBootstrap?.workspace.role || "Candidate";
  const roleProfile = roleProfiles[currentRole] ?? roleProfiles.Candidate;
  const allowedNavLabels = roleNavItems[currentRole] ?? roleNavItems.Candidate;
  const visibleNavItems = navItems.filter((item) => allowedNavLabels.includes(item.label));
  const isOwnerAccount = currentRole === "Candidate" || currentRole === "Admin" || liveBootstrap?.workspace.isPlatformAdmin;
  const currentMemberName =
    currentMember?.full_name?.trim()
    || readableNameFromContact(currentMember?.phone_number)
    || readableNameFromContact(currentMember?.email)
    || (isOwnerAccount ? referenceCandidateName : `${currentRole} Member`);
  const profileSection = allowedNavLabels.includes("Team & Roles") ? "Team & Roles" : "Dashboard";
  const accountSection = isOwnerAccount ? "Candidate Management" : profileSection;
  const paymentUrl = `/payment/confirm?accountReference=${encodeURIComponent(liveBootstrap?.workspace.candidateId ? `JUKWAA-${liveBootstrap.workspace.candidateId.slice(0, 8).toUpperCase()}` : "JUKWAA-WORKSPACE")}&amountKes=45000`;
  const normalizedPosition = campaignPosition.toLowerCase();
  const isNationalRace = normalizedPosition.includes("president") || normalizedPosition.includes("referendum");
  const isCountyRace = ["governor", "senator", "women representative", "woman representative", "women rep", "woman rep"].some((position) => normalizedPosition.includes(position));
  const isMcaRace = normalizedPosition.includes("mca");
  const scopeLevel: ElectoralFocusArea["level"] = isNationalRace ? "country" : isCountyRace ? "county" : isMcaRace ? "ward" : "constituency";
  const analysisLevel: ElectoralFocusArea["level"] = isNationalRace ? "county" : isCountyRace ? "constituency" : isMcaRace ? "local" : "ward";
  const electiveScopeLabel = isNationalRace
    ? "Kenya"
    : isCountyRace
      ? `${campaignCounty || "County"} County`
      : isMcaRace
        ? `${campaignWard || supporterWard || "Ward"} Ward`
        : `${campaignConstituency || "Constituency"} Constituency`;
  const candidateDescriptor = `${campaignPosition} candidate for ${electiveScopeLabel}`;
  const personalWorkspaceTitle = isOwnerAccount ? (liveBootstrap?.campaign?.campaign_name || `${referenceCandidateName} Campaign`) : `${currentMemberName} Workspace`;
  const personalWorkspaceSubtitle = isOwnerAccount
    ? `${referenceCandidateName}, ${candidateDescriptor}`
    : `${currentMemberName}, ${currentRole} for ${referenceCandidateName}, ${candidateDescriptor}`;
  const memberAssignmentLabel = [
    currentMember?.polling_station_name,
    currentMember?.village_name,
    currentMember?.ward_name,
    currentMember?.constituency_name,
    currentMember?.county_name,
  ].find((value) => typeof value === "string" && value.trim()) || electiveScopeLabel;
  const geographyLadder = isNationalRace
    ? ["Kenya", "Counties", "Constituencies", "Wards", "Local Units"]
    : isCountyRace
      ? [`${campaignCounty || "County"} County`, "Constituencies", "Wards", "Local Units"]
      : isMcaRace
        ? [`${campaignWard || "Ward"} Ward`, "Local Units", "Polling Stations"]
        : [`${campaignConstituency || "Constituency"} Constituency`, "Wards", "Local Units"];
  const focusAreas: ElectoralFocusArea[] = (() => {
    if (scopeLevel === "country") {
      return kenyaCounties.map((countyName) => ({ label: countyName, chartName: countyName, level: "county", countyName, constituencyName: "", wardName: "" }));
    }
    if (scopeLevel === "county" && campaignCounty) {
      return constituenciesForCounty(campaignCounty).map((constituencyName) => ({ label: constituencyName, chartName: constituencyName, level: "constituency", countyName: campaignCounty, constituencyName, wardName: "" }));
    }
    if (scopeLevel === "ward" && normalizedPosition.includes("mca") && campaignConstituency) {
      const wardName = campaignWard || wardsForConstituency(campaignConstituency)[0] || "";
      const localUnits = workspaceSupporters
        .filter((supporter) => !wardName || supporter.ward === wardName || supporter.ward === "Not assigned")
        .map((supporter) => supporter.pollingStation)
        .filter((value) => value && value !== "Not assigned");
      const uniqueLocalUnits = Array.from(new Set(localUnits));
      return (uniqueLocalUnits.length ? uniqueLocalUnits : ["Local Units", "Polling Stations"]).map((localName) => ({
        label: localName,
        chartName: localName,
        level: localName === "Polling Stations" ? "pollingStation" : "local",
        countyName: campaignCounty || countyForConstituency(campaignConstituency),
        constituencyName: campaignConstituency,
        wardName,
        localName,
        pollingStationName: localName,
      }));
    }
    if (campaignConstituency) {
      const countyName = campaignCounty || countyForConstituency(campaignConstituency);
      return wardsForConstituency(campaignConstituency).map((wardName) => ({ label: wardName, chartName: wardName, level: "ward", countyName, constituencyName: campaignConstituency, wardName }));
    }
    return [];
  })();
  const focusWards = (() => {
    if (scopeLevel === "country") return wardsForKenya().map((area) => area.ward);
    if (scopeLevel === "county" && campaignCounty) return wardsForCounty(campaignCounty).map((area) => area.ward);
    return campaignConstituency ? wardsForConstituency(campaignConstituency) : [];
  })();
  const effectiveFocusArea = focusAreas.find((area) => area.label === supporterWard) ?? focusAreas[0] ?? { label: "", chartName: "", level: scopeLevel, countyName: campaignCounty, constituencyName: campaignConstituency, wardName: "" };
  const effectiveSupporterWard = effectiveFocusArea.wardName || supporterWard || "";
  const focusAreaPlural = analysisLevel === "county" ? "counties" : analysisLevel === "constituency" ? "constituencies" : analysisLevel === "local" ? "local units" : "wards";
  const focusAreaSingular = analysisLevel === "county" ? "County" : analysisLevel === "constituency" ? "Constituency" : analysisLevel === "local" ? "Local unit" : "Ward";
  const selectedLocationPayload = {
    countyName: effectiveFocusArea.countyName || campaignCounty,
    constituencyName: effectiveFocusArea.constituencyName || campaignConstituency,
    wardName: effectiveFocusArea.wardName || effectiveSupporterWard,
  };
  const totalSupporters = liveBootstrap?.summary.supporters ?? workspaceSupporters.length;
  const totalVolunteers = liveBootstrap?.summary.volunteers ?? liveVolunteers.length;
  const totalPollingAgents = liveBootstrap?.summary.pollingAgents ?? livePollingAgents.length;
  const totalTasks = liveBootstrap?.summary.tasks ?? liveTasks.length;
  const tasksCompletedCount = liveBootstrap?.summary.tasksCompleted ?? liveTasks.filter((task) => liveText(task, "status") === "Completed").length;
  const tasksCompletedPercent = totalTasks ? Math.round((tasksCompletedCount / totalTasks) * 100) : 0;
  const eventsCount = liveBootstrap?.summary.events ?? liveEvents.length;
  const unreadNotificationCount = liveBootstrap?.summary.unreadNotifications ?? liveNotifications.length;
  const openMessageCount = liveBootstrap?.summary.messagesOpen ?? liveMessages.filter((message) => liveText(message, "status") === "Queued" || liveText(message, "status") === "Draft").length;
  const workspaceNotifications = liveNotifications.map((notification) => ({
        title: liveText(notification, "title", "Notification"),
        detail: liveText(notification, "body", "No details recorded."),
      }));
  const workspaceCommunicationRooms = usingLiveData
    ? liveRooms.map((room) => ({
        id: String(room.id),
        title: liveText(room, "title", "Campaign room"),
        livekitRoomName: liveText(room, "livekit_room_name", "jukwaa-room"),
        purpose: liveText(room, "purpose", "Campaign coordination"),
        status: liveText(room, "status", "Scheduled"),
        audience: liveText(room, "audience", "Campaign team"),
        scheduledAt: liveDate(room, "scheduled_at", "Not scheduled"),
        participants: liveNumber(room, "expected_participants", 0),
      }))
    : communicationRooms;
  const workspaceCommunicationMessages = usingLiveData
    ? liveMessages.map((message) => ({
        id: String(message.id),
        channel: liveText(message, "channel", "Campaign Chat"),
        subject: liveText(message, "subject", "Message"),
        body: liveText(message, "body", ""),
        sender: "Workspace",
        audience: liveText(message, "audience", "Campaign team"),
        status: liveText(message, "status", "Draft"),
        deliveryStatus: liveText(message, "delivery_status", "Not Sent"),
        providerName: liveText(message, "provider_name", ""),
        deliveryError: liveText(message, "delivery_error", ""),
        recipientCount: Array.isArray(message.recipient_phones) ? message.recipient_phones.length : 0,
        sentAt: liveDate(message, "sent_at", liveDate(message, "created_at", "")),
      }))
    : communicationMessages.map((message) => ({
        ...message,
        body: "",
        deliveryStatus: message.status,
        providerName: "",
        deliveryError: "",
        recipientCount: 0,
      }));
  const workspaceAiContentAssets = usingLiveData
    ? liveAiAssets.map((asset) => ({
        id: String(asset.id),
        title: liveText(asset, "title", "AI content draft"),
        type: liveText(asset, "asset_type", "Campaign Message"),
        audience: liveText(asset, "audience", "Campaign audience"),
        status: liveText(asset, "status", "Draft"),
      }))
    : aiContentAssets;
  const workspacePvtRows = livePollingResults.reduce<Array<{ candidate: string; votes: number }>>((rows, result) => {
        const candidate = liveText(result, "candidate_name", "Candidate");
        const existing = rows.find((row) => row.candidate === candidate);
        if (existing) existing.votes += liveNumber(result, "votes", 0);
        else rows.push({ candidate, votes: liveNumber(result, "votes", 0) });
        return rows;
      }, []);
  const workspaceQualityQueue = livePollingResults
        .filter((result) => liveText(result, "verification_status", "Pending") !== "Verified")
        .map((result) => ({
          station: "Polling station",
          formType: "Result",
          uploadedBy: liveText(result, "candidate_name", "Candidate"),
          status: liveText(result, "verification_status", "Pending"),
          flags: `${liveNumber(result, "votes", 0)} votes / ${liveNumber(result, "total_votes", 0)} total votes recorded.`,
        }));
  const workspaceResultCards = livePollingResults.map((result) => ({
        id: String(result.id),
        candidate: liveText(result, "candidate_name", "Candidate"),
        pollingStation: "Polling station",
        votes: liveNumber(result, "votes", 0),
        totalVotes: liveNumber(result, "total_votes", 0),
        rejectedVotes: liveNumber(result, "rejected_votes", 0),
        verificationStatus: liveText(result, "verification_status", "Pending"),
      }));
  const workspaceSecurityEvents = liveAuditLogs.map((event) => ({
        id: String(event.id),
        event: `${liveText(event, "action", "Action")} - ${liveText(event, "module", "Module")}`,
        user: "Workspace member",
        device: "Web",
        ipAddress: "",
        createdAt: liveDate(event, "created_at", ""),
      }));
  const workspaceTaskRows = liveTasks.map((task) => ({
        id: String(task.id),
        title: liveText(task, "title", "Task"),
        dueDate: liveDate(task, "due_date", ""),
        status: liveText(task, "status", "Pending"),
      }));
  const workspaceFieldVisitRows = liveFieldVisits.map((visit) => ({
        id: String(visit.id),
        volunteer: liveText(visit, "ward_name", "Field visit"),
        latitude: liveNumber(visit, "latitude", 0),
        longitude: liveNumber(visit, "longitude", 0),
        description: `${liveText(visit, "visit_purpose", "Field activity")} - ${liveText(visit, "polling_station_name", liveText(visit, "village_name", electiveScopeLabel))}`,
        supportersEngaged: liveNumber(visit, "supporters_engaged", 0),
        dateLabel: liveDate(visit, "visit_date", ""),
      }));
  const workspaceIssueRows = liveIssues.map((issue) => ({
        id: String(issue.id),
        title: liveText(issue, "issue_title", "Community issue"),
        meta: `${liveText(issue, "category", "Other")} - ${liveText(issue, "ward_name", electiveScopeLabel)}${liveText(issue, "village_name", "") ? ` / ${liveText(issue, "village_name", "")}` : ""}`,
        priority: liveText(issue, "priority_level", "Medium"),
        description: liveText(issue, "description", "No description recorded."),
        mentions: liveNumber(issue, "number_of_mentions", 1),
        status: liveText(issue, "status", "Open"),
      }));
  const workspaceIntelligenceRows = usingLiveData
    ? [
        ...liveIssues.slice(0, 6).map((issue) => ({
          id: `issue-${String(issue.id)}`,
          title: liveText(issue, "issue_title", `${electiveScopeLabel} issue signal`),
          category: liveText(issue, "category", "Community Issue"),
          location: [
            liveText(issue, "county_name", ""),
            liveText(issue, "constituency_name", ""),
            liveText(issue, "ward_name", ""),
            liveText(issue, "village_name", ""),
            liveText(issue, "polling_station_name", ""),
          ].filter(Boolean).join(" / ") || electiveScopeLabel,
          description: liveText(issue, "description", `Follow up with residents in ${electiveScopeLabel}.`),
          urgency: liveText(issue, "priority_level", "Medium"),
          submittedBy: "Field issue desk",
          createdAt: liveDate(issue, "created_at", "Live workspace"),
          photos: 0,
        })),
        ...liveFieldVisits.slice(0, 4).map((visit) => ({
          id: `visit-${String(visit.id)}`,
          title: liveText(visit, "visit_purpose", `${electiveScopeLabel} field activity`),
          category: "Field Visit",
          location: [
            liveText(visit, "county_name", ""),
            liveText(visit, "constituency_name", ""),
            liveText(visit, "ward_name", ""),
            liveText(visit, "village_name", ""),
            liveText(visit, "polling_station_name", ""),
          ].filter(Boolean).join(" / ") || electiveScopeLabel,
          description: `${liveNumber(visit, "supporters_engaged", 0)} supporters engaged. ${liveText(visit, "notes", "No extra notes recorded.")}`,
          urgency: liveNumber(visit, "supporters_engaged", 0) > 0 ? "Medium" : "Low",
          submittedBy: "Field team",
          createdAt: liveDate(visit, "visit_date", liveDate(visit, "created_at", "Live workspace")),
          photos: Array.isArray(visit.photos) ? visit.photos.length : 0,
        })),
        ...liveNotifications.slice(0, 3).map((notification) => ({
          id: `notification-${String(notification.id)}`,
          title: liveText(notification, "title", "Campaign notification"),
          category: "Internal Signal",
          location: electiveScopeLabel,
          description: liveText(notification, "body", "No details recorded."),
          urgency: liveText(notification, "status", "Medium") === "Unread" ? "High" : "Medium",
          submittedBy: "JUKWAA workspace",
          createdAt: liveDate(notification, "created_at", "Live workspace"),
          photos: 0,
        })),
      ].slice(0, 8)
    : [];
  const workspaceEventRows = liveEvents.map((event) => ({
        id: String(event.id),
        title: liveText(event, "title", "Campaign event"),
        meta: `${liveText(event, "type", "Event")} - ${liveDate(event, "event_date", "")}`,
        badge: "Planned",
        venue: liveText(event, "venue", "Venue not recorded"),
        expectedAttendance: liveNumber(event, "expected_attendance", 0),
      }));
  const globalSearchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query || !usingLiveData) return [];
    const rows: Array<{ title: string; type: string; section: string; detail: string }> = [];
    workspaceSupporters.forEach((supporter) => rows.push({ title: supporter.fullName, type: "Supporter", section: "Supporters", detail: `${supporter.phoneNumber} ${supporter.keyIssue}` }));
    liveVolunteers.forEach((volunteer) => rows.push({ title: liveText(volunteer, "full_name", "Volunteer"), type: "Volunteer", section: "Volunteers", detail: `${liveText(volunteer, "phone_number", "")} ${liveText(volunteer, "status", "")}` }));
    livePollingAgents.forEach((agent) => rows.push({ title: liveText(agent, "full_name", "Polling Agent"), type: "Polling Agent", section: "Polling Agents", detail: `${liveText(agent, "phone_number", "")} ${liveText(agent, "status", "")}` }));
    liveTasks.forEach((task) => rows.push({ title: liveText(task, "title", "Task"), type: "Task", section: "Tasks & Field Ops", detail: `${liveText(task, "status", "")} ${liveDate(task, "due_date", "")}` }));
    liveEvents.forEach((event) => rows.push({ title: liveText(event, "title", "Event"), type: "Event", section: "Events", detail: `${liveText(event, "venue", "")} ${liveDate(event, "event_date", "")}` }));
    liveIssues.forEach((issue) => rows.push({ title: liveText(issue, "issue_title", "Issue"), type: "Issue", section: "Issues & Manifesto", detail: `${liveText(issue, "category", "")} ${liveText(issue, "status", "")}` }));
    liveMessages.forEach((message) => rows.push({ title: liveText(message, "subject", "Message"), type: "Message", section: "Communications", detail: `${liveText(message, "channel", "")} ${liveText(message, "status", "")}` }));
    return rows.filter((row) => `${row.title} ${row.type} ${row.detail}`.toLowerCase().includes(query)).slice(0, 8);
  }, [liveEvents, liveIssues, liveMessages, livePollingAgents, liveTasks, liveVolunteers, searchQuery, usingLiveData, workspaceSupporters]);
  const visibleSupporters = workspaceSupporters.filter((supporter) => {
    const query = searchQuery.trim().toLowerCase();
    return !query || supporter.fullName.toLowerCase().includes(query) || supporter.phoneNumber.includes(query) || supporter.ward.toLowerCase().includes(query);
  });
  const duplicate = useMemo(() => {
    const normalizedPhone = phone.replace(/\D/g, "");
    if (!name.trim() && !normalizedPhone) return false;
    return workspaceSupporters.some((supporter) => (normalizedPhone.length >= 7 && supporter.phoneNumber.replace(/\D/g, "") === normalizedPhone) || (name.trim().length >= 2 && supporter.fullName.toLowerCase() === name.toLowerCase().trim()));
  }, [name, phone, workspaceSupporters]);

  const supportLevelData = groupCount(workspaceSupporters, "supportLevel");
  const focusDataKey = analysisLevel === "county" ? "county" : analysisLevel === "constituency" ? "constituency" : analysisLevel === "local" ? "pollingStation" : "ward";
  const liveFocusCounts = groupCount(workspaceSupporters, focusDataKey).filter((row) => row.name !== "Not assigned" && row.name !== "Not recorded");
  const wardData = liveFocusCounts.length
    ? liveFocusCounts
    : focusAreas.map((area) => ({ name: area.chartName, value: 0 }));
  const genderData = groupCount(workspaceSupporters, "gender");
  const ageData = groupCount(workspaceSupporters, "ageGroup");
  const issueData = groupCount(workspaceSupporters, "keyIssue").slice(0, 6);
  const stationData = groupCount(workspaceSupporters, "pollingStation");
  const pollingRows: Array<{ id: string; name: string; ward: string; registeredVoters: number; identifiedSupporters: number; strong: number; undecided: number; penetration: number }> = [];
  const volunteerRows = liveVolunteers.map((volunteer) => ({
        name: liveText(volunteer, "full_name", "Volunteer"),
        phoneNumber: liveText(volunteer, "phone_number", ""),
        area: liveText(volunteer, "ward_name", electiveScopeLabel),
        assignedSupervisor: liveText(volunteer, "assigned_supervisor_name", "Campaign HQ"),
        status: liveText(volunteer, "status", "Unknown"),
        supportersRegistered: workspaceSupporters.filter((supporter) => supporter.ward === liveText(volunteer, "ward_name", "")).length,
        activitiesCompleted: liveTasks.filter((task) => liveText(task, "status", "") === "Completed").length,
        issuesSubmitted: liveIssues.filter((issue) => liveText(issue, "ward_name", "") === liveText(volunteer, "ward_name", "")).length,
        eventsAttended: 0,
        score: liveText(volunteer, "status", "") === "Active" ? 80 : 35,
      }));
  const coverageRows = (focusAreas.length ? focusAreas : wardData.map((row) => ({ label: row.name, chartName: row.name, level: scopeLevel, countyName: "", constituencyName: "", wardName: row.name }))).map((area) => {
        const areaSupporters = workspaceSupporters.filter((supporter) => {
          if (area.level === "county") return supporter.county === area.countyName || supporter.county === area.label;
          if (area.level === "constituency") return supporter.constituency === area.constituencyName || supporter.constituency === area.label;
          if (area.level === "ward") return supporter.ward === area.wardName || supporter.ward === area.label || supporter.pollingStation === area.label;
          if (area.level === "local" || area.level === "pollingStation") return supporter.pollingStation === area.pollingStationName || supporter.pollingStation === area.label || supporter.ward === area.wardName;
          return true;
        }).length;
        const areaVisits = liveFieldVisits.filter((visit) => {
          if (area.level === "constituency") return liveText(visit, "constituency_name", "") === area.constituencyName || liveText(visit, "constituency_name", "") === area.label;
          if (area.level === "ward") return liveText(visit, "ward_name", "") === area.wardName || liveText(visit, "ward_name", "") === area.label;
          if (area.level === "local" || area.level === "pollingStation") return liveText(visit, "polling_station_name", "") === area.pollingStationName || liveText(visit, "village_name", "") === area.localName || liveText(visit, "ward_name", "") === area.wardName;
          return liveText(visit, "county_name", "") === area.countyName || liveText(visit, "county_name", "") === area.label;
        }).length;
        const areaIssues = liveIssues.filter((issue) => {
          if (area.level === "constituency") return liveText(issue, "constituency_name", "") === area.constituencyName || liveText(issue, "constituency_name", "") === area.label;
          if (area.level === "ward") return liveText(issue, "ward_name", "") === area.wardName || liveText(issue, "ward_name", "") === area.label;
          if (area.level === "local" || area.level === "pollingStation") return liveText(issue, "polling_station_name", "") === area.pollingStationName || liveText(issue, "village_name", "") === area.localName || liveText(issue, "ward_name", "") === area.wardName;
          return liveText(issue, "county_name", "") === area.countyName || liveText(issue, "county_name", "") === area.label;
        }).length;
        const score = Math.min(100, Math.round(areaSupporters * 8 + areaVisits * 18 + areaIssues * 10));
        return {
          name: area.chartName,
          ward: area.wardName || area.constituencyName || area.countyName || area.label,
          village: area.level === "county" ? "County campaign unit" : area.level === "constituency" ? "Constituency campaign unit" : area.level === "local" || area.level === "pollingStation" ? `${area.wardName || electiveScopeLabel} ground unit` : campaignConstituency || electiveScopeLabel,
          score,
          status: score >= 70 ? "Well covered" : score >= 35 ? "Moderately covered" : "Needs activity",
          supporters: areaSupporters,
          visits: areaVisits,
          events: liveEvents.length,
          issues: areaIssues,
        };
      });
  const issueBreakdown = groupCount(liveIssues.map((issue) => ({ category: liveText(issue, "category", "Other") })), "category");
  const eventTrend = liveEvents.map((event, index) => {
    const expected = liveNumber(event, "expected_attendance", 0);
    return {
      name: liveDate(event, "event_date", `Event ${index + 1}`),
      expected,
      actual: Math.max(0, Math.round(expected * 0.82)),
    };
  });
  const agentRows = livePollingAgents.map((agent) => ({
        station: liveText(agent, "polling_station_name", "Polling station"),
        ward: liveText(agent, "ward_name", electiveScopeLabel),
        agent: liveText(agent, "full_name", "Polling Agent"),
        status: liveText(agent, "status", "Pending"),
        turnout: 0,
        health: liveText(agent, "status", "") === "Active" ? "Green" : "Amber",
      }));
  const turnoutRows: Array<{ interval: string; percentage: number }> = [];
  const mobilizationRows = wardData.map((row) => ({
    station: row.name,
    ward: row.name,
    strongSupporters: workspaceSupporters.filter((supporter) => supporter.ward === row.name && supporter.supportLevel === "Strong Supporter").length,
    turnoutPercentage: totalSupporters ? Math.round((row.value / totalSupporters) * 100) : 0,
    conversionSignal: row.value,
    recommendation: row.value ? `Follow up with ${row.value} known supporters in ${row.name}.` : `Start supporter capture in ${row.name}.`,
  }));
  const pvtRows = workspacePvtRows;
  const qualityQueue = workspaceQualityQueue;
  const workspaceInvitations = (liveBootstrap?.invitations ?? []).map((invite) => ({
    id: String(invite.id),
    invitedName: liveText(invite, "invited_name", "Invited team member"),
    role: liveText(invite, "role", "Team Member"),
    invitedPhone: liveText(invite, "invited_phone", liveText(invite, "invited_email", "No contact recorded")),
    invitationCode: liveText(invite, "join_code", liveText(invite, "invitation_code", "Join code pending")),
    expiryDate: liveDate(invite, "expiry_date", "No expiry set"),
    status: liveText(invite, "status", "Pending"),
  }));
  const pendingInvitationId = workspaceInvitations.find((invite) => invite.status === "Pending")?.id;
  const workspaceElectionRows = [{
    id: `${liveBootstrap?.workspace.candidateId ?? "candidate"}-${campaignPosition}-${campaignCounty}-${campaignConstituency}-${campaignWard}`,
    electionName: `${campaignPosition} Campaign ${liveBootstrap?.campaign?.election_year || "2027"}`,
    electionType: campaignPosition,
    geography: electiveScopeLabel,
    status: liveBootstrap?.campaign?.active_status || "Active",
    electionDate: liveBootstrap?.campaign?.election_year ? `${liveBootstrap.campaign.election_year} election cycle` : "Election cycle not set",
  }];
  const workspaceUserRows = [
    {
      id: "candidate-owner",
      name: referenceCandidateName,
      role: "Candidate",
      geography: electiveScopeLabel,
      status: commercialAccess?.allowed ? "Active" : commercialAccess?.status || "Pending Access",
    },
    !isOwnerAccount ? {
      id: String(currentMember?.id || "current-member"),
      name: currentMemberName,
      role: currentRole,
      geography: memberAssignmentLabel,
      status: currentMember?.status || "Active",
    } : null,
    ...workspaceInvitations.map((invite) => ({
      id: invite.id,
      name: invite.invitedName,
      role: invite.role,
      geography: electiveScopeLabel,
      status: invite.status,
    })),
    ...liveVolunteers.map((volunteer) => ({
      id: `volunteer-${String(volunteer.id)}`,
      name: liveText(volunteer, "full_name", "Volunteer"),
      role: "Volunteer",
      geography: liveText(volunteer, "ward_name", liveText(volunteer, "constituency_name", electiveScopeLabel)),
      status: liveText(volunteer, "status", "Pending"),
    })),
    ...livePollingAgents.map((agent) => ({
      id: `agent-${String(agent.id)}`,
      name: liveText(agent, "full_name", "Polling Agent"),
      role: "Polling Agent",
      geography: liveText(agent, "polling_station_name", liveText(agent, "ward_name", electiveScopeLabel)),
      status: liveText(agent, "status", "Pending"),
    })),
  ].filter(Boolean) as Array<{ id: string; name: string; role: string; geography: string; status: string }>;
  const workspaceAuditRows = liveAuditLogs.map((event) => ({
    id: String(event.id),
    action: liveText(event, "action", "Workspace action"),
    module: liveText(event, "module", "Workspace"),
    user: "Workspace member",
    timestamp: liveDate(event, "created_at", "Live workspace"),
  }));
  const hierarchyRows = [
    { level: "1", role: "Candidate / Owner", name: referenceCandidateName, reportsTo: "Voters in " + electiveScopeLabel, members: 1, status: "Active" },
    { level: "2", role: "Campaign Managers", name: `${workspaceInvitations.filter((invite) => invite.role.includes("Manager")).length} invited`, reportsTo: referenceCandidateName, members: workspaceInvitations.filter((invite) => invite.role.includes("Manager")).length, status: workspaceInvitations.some((invite) => invite.role.includes("Manager")) ? "Active" : "Open" },
    { level: "3", role: "Volunteers", name: `${liveVolunteers.length} live records`, reportsTo: "Campaign Manager", members: liveVolunteers.length, status: liveVolunteers.length ? "Active" : "Open" },
    { level: "4", role: "Polling Agents", name: `${livePollingAgents.length} live records`, reportsTo: "Field Coordinator", members: livePollingAgents.length, status: livePollingAgents.length ? "Active" : "Open" },
  ];
  const aiRows = [
        {
          id: "live-supporters",
          title: totalSupporters ? "Grow supporter depth from live records" : "Start by registering supporters",
          description: totalSupporters ? `${totalSupporters.toLocaleString()} supporters are available for segmentation and follow-up.` : "No supporters are in this workspace yet. Add supporters first so AI can reason from real campaign data.",
          impactScore: totalSupporters ? 82 : 45,
          category: "Action",
          source: "Live supporter CRM",
        },
        {
          id: "live-issues",
          title: liveIssues.length ? "Prioritize unresolved community issues" : "Capture community issues",
          description: liveIssues.length ? `${liveIssues.length} issues are available for manifesto follow-up and response assignment.` : "No live issues have been reported yet.",
          impactScore: liveIssues.length ? 76 : 35,
          category: "Strategy",
          source: "Live issues register",
        },
        {
          id: "live-ops",
          title: totalTasks ? "Review field task completion" : "Create first field task",
          description: totalTasks ? `${tasksCompletedCount}/${totalTasks} tasks are completed. Overdue tasks: ${liveBootstrap?.summary.tasksOverdue ?? 0}.` : "No field tasks exist yet. Create one for a volunteer or coordinator.",
          impactScore: totalTasks ? 70 : 40,
          category: "Operations",
          source: "Live task board",
        },
      ];
  const budgetRows: Array<{ category: string; usedPercent: number; remaining: number }> = [];

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
        if (active && payload) {
          setLiveBootstrap(payload);
          setLiveSupporters(payload.supporters.map(normalizeSupporter));
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  async function refreshWorkspace() {
    const response = await fetch("/api/dashboard/bootstrap", { credentials: "include" });
    if (!response.ok) return;
    const payload = await response.json() as LiveBootstrap;
    setLiveBootstrap(payload);
    setLiveSupporters(payload.supporters.map(normalizeSupporter));
  }

  const readinessLabel = currentRole === "Campaign Manager" ? "Manager Execution Readiness" : currentRole === "Polling Agent" ? "Station Readiness" : currentRole === "Volunteer" ? "Field Readiness" : "Campaign Readiness";
  const readinessHelper = currentRole === "Campaign Manager" ? `Your execution cockpit for ${referenceCandidateName}'s ${electiveScopeLabel} campaign.` : currentRole === "Polling Agent" ? `Focus on ${memberAssignmentLabel} station tasks, incidents, turnout, and results.` : currentRole === "Volunteer" ? `Focus on field tasks, supporters, issues, and visits in ${memberAssignmentLabel}.` : !isOwnerAccount ? `Your ${currentRole} tools are scoped to ${memberAssignmentLabel}.` : "You are making great progress.";
  useEffect(() => {
    if (!allowedNavLabels.includes(activeSection)) {
      queueMicrotask(() => setActiveSection("Dashboard"));
    }
  }, [activeSection, allowedNavLabels]);
  const workspaceSolco = {
    status: liveBootstrap?.livekit?.configured ? "Ready" : (liveBootstrap?.solcoIntegration?.status || solcoIntegration.status),
    tokenEndpoint: liveBootstrap?.solcoIntegration?.token_endpoint || solcoIntegration.tokenEndpoint,
    workspaceUrl: liveBootstrap?.solcoIntegration?.workspace_url || solcoIntegration.workspaceUrl,
    livekitUrl: liveBootstrap?.livekit?.urlLabel || liveBootstrap?.solcoIntegration?.livekit_url_label || solcoIntegration.livekitUrl,
    meetingPath: liveBootstrap?.solcoIntegration?.meeting_path || solcoIntegration.meetingPath,
  };
  const dashboardMetrics = [
    { label: "Supporters", value: totalSupporters.toLocaleString(), helper: "live workspace total", icon: Users, tone: "sky" },
    { label: "Volunteers", value: totalVolunteers.toLocaleString(), helper: "live workspace total", icon: UserCheck, tone: "gold" },
    { label: "Polling Agents", value: totalPollingAgents.toLocaleString(), helper: "live workspace total", icon: ShieldCheck, tone: "emerald" },
    { label: "Tasks Completed", value: `${tasksCompletedPercent}%`, helper: `${tasksCompletedCount.toLocaleString()} of ${totalTasks.toLocaleString()} tasks`, icon: CheckCircle2, tone: "violet" },
    { label: "Events", value: eventsCount.toLocaleString(), helper: "live workspace total", icon: CalendarDays, tone: "red" },
  ];
  const actionQueue = [
    { label: "Supporter Records", value: totalSupporters, icon: Users, tone: "sky", section: "Supporters" },
    { label: "Volunteer Applications", value: totalVolunteers, icon: UserCheck, tone: "gold", section: "Volunteers" },
    { label: "Polling Agent Applications", value: totalPollingAgents, icon: ShieldCheck, tone: "emerald", section: "Polling Agents" },
    { label: "Open Issues", value: liveBootstrap?.summary.issues ?? 0, icon: Siren, tone: "red", section: "Issues & Manifesto" },
    { label: "Tasks Overdue", value: liveBootstrap?.summary.tasksOverdue ?? 0, icon: AlertTriangle, tone: "amber", section: "Tasks & Field Ops" },
  ];
  const progressRows = [
    ["Organization", 85, Building2],
    ["Field Operations", 68, ClipboardCheck],
    ["Communications", 74, MessageSquare],
    ["Fundraising", 59, HandCoins],
    ["Voter Outreach", 78, Vote],
  ] as const;
  const quickActions = [
    ...roleProfile.quickActions,
    ["Logout", X, "Logout"],
  ] as Array<[string, typeof Users, string]>;
  const recentActivityRows = [
    ["Supporter Registration", `New supporter activity in ${electiveScopeLabel}`, "Field Agent", "2 min ago", "New"],
    ["Volunteer Application", "Application from Mary Wanjiku", "System", "15 min ago", "Pending"],
    ["Task Completed", `Door-to-door canvassing in ${effectiveFocusArea.label || electiveScopeLabel}`, "Volunteer", "1 hour ago", "Completed"],
    ["Payment Received", "M-Pesa payment of KES 25,000", "System", "3 hours ago", "Confirmed"],
    ["Incident Reported", `Incident logged inside ${electiveScopeLabel}`, "Agent", "5 hours ago", "Open"],
  ];
  const countyBreakdown = (wardData.length ? wardData.slice(0, 6) : [{ name: "No records yet", value: 0 }]).map((row, index) => {
    const colors = ["#1d6fff", "#d6a200", "#16a34a", "#7c3aed", "#f97316", "#d1d5db"];
    const percent = totalSupporters ? Math.round((row.value / totalSupporters) * 1000) / 10 : 0;
    return [row.name, `${row.value.toLocaleString()} (${percent}%)`, colors[index] ?? "#d1d5db"] as const;
  });
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
  const activeSubtitle = activeSection === "Dashboard" ? personalWorkspaceSubtitle : `Manage ${activeSection.toLowerCase()} as ${currentRole} for ${referenceCandidateName}`;
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

  function openPrimaryAction() {
    const targets: Record<string, string> = {
      Supporters: "supporter-form",
      "Tasks & Field Ops": "field-operations",
      Events: "events-rallies",
      "Issues & Manifesto": "field-operations",
      Communications: "communications",
      "AI Campaign Studio": "ai-assistant",
      "Reports & Analytics": "reports",
    };
    if (activeSection === "Volunteers") { window.location.assign("/signup/user?role=Volunteer"); return; }
    if (activeSection === "Polling Agents" && ["Candidate", "Campaign Manager", "Admin"].includes(currentRole)) { window.location.assign("/signup/user?role=Polling%20Agent"); return; }
    if (activeSection === "Polling Agents") { scrollToSection("Turnout Monitoring"); return; }
    if (activeSection === "Team & Roles") { window.location.assign("/signup/user"); return; }
    const target = targets[activeSection];
    if (!target) { runAction(`${activeSection} action is available from its workspace panel.`, activeSection); return; }
    const section = target === "communications" ? "Communications" : target === "ai-assistant" ? "AI Campaign Assistant" : activeSection;
    scrollToSection(section);
    window.setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
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
      if (workflow === "supporter" && result.supporter) {
        setLiveSupporters((current) => [normalizeSupporter(result.supporter), ...(current ?? [])]);
        setName("");
        setPhone("");
        setSupportLevel("Unknown");
        setSupporterVillage("");
        setSupporterPollingStation("");
        setSupporterKeyIssue("");
        setOverrideDuplicate(false);
      }
      if (["communicationRoom", "communicationMessage", "issue", "issueStatus", "fieldVisit", "aiContent", "task", "event"].includes(workflow)) {
        await refreshWorkspace();
      }
      runAction(successMessage, sectionLabel);
    } catch (error) {
      runAction(error instanceof Error ? error.message : "Workflow could not be saved.", sectionLabel);
    }
  }

  function parseRecipientPhones(value: string) {
    return value
      .split(/[\n,;]+/)
      .map((recipient) => recipient.trim())
      .filter(Boolean);
  }

  function useSupporterPhones() {
    const phones = workspaceSupporters
      .map((supporter) => supporter.phoneNumber)
      .filter((phoneNumber) => phoneNumber.replace(/\D/g, "").length >= 7);
    setMessageRecipients(Array.from(new Set(phones)).join("\n"));
    setMessageAudience(`${electiveScopeLabel} supporters`);
  }

  async function submitCampaignMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessageDeliveryNotice("");

    const recipients = parseRecipientPhones(messageRecipients);
    const audience = messageAudience || `${electiveScopeLabel} team`;

    if (messageChannel !== "Broadcast SMS" && messageChannel !== "WhatsApp") {
      await persistWorkflow(
        "communicationMessage",
        {
          channel: messageChannel,
          subject: messageSubject,
          body: messageBody,
          audience,
          recipientPhones: recipients,
          status: messageStatus,
        },
        "Campaign message saved to the queue.",
        "Communications",
      );
      setMessageSubject("");
      setMessageBody("");
      setMessageRecipients("");
      setMessageStatus("Draft");
      return;
    }

    if (!recipients.length) {
      setMessageDeliveryNotice("Add at least one phone number before sending.");
      return;
    }

    setMessageSending(true);
    try {
      const response = await fetch("/api/communications/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: messageChannel,
          subject: messageSubject,
          body: messageBody,
          audience,
          recipients,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Message could not be sent.");
      }

      await refreshWorkspace();
      setMessageSubject("");
      setMessageBody("");
      setMessageRecipients("");
      setMessageAudience("");
      setMessageStatus("Draft");
      const deliveryText = payload.message ? `${payload.status}: ${payload.message}` : `Message ${String(payload.status).toLowerCase()}.`;
      setMessageDeliveryNotice(deliveryText);
      runAction(deliveryText, "Communications");
      if (payload.launchUrl) {
        window.open(payload.launchUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      setMessageDeliveryNotice(error instanceof Error ? error.message : "Message could not be sent.");
    } finally {
      setMessageSending(false);
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
      const roomPath = workspaceSolco.meetingPath.replace("{roomName}", payload.roomName);
      setMeetingTokenStatus(`Token issued for ${payload.roomName}. Join through Solco-compatible room URL ${workspaceSolco.workspaceUrl}${roomPath}.`);
    } catch (error) {
      setMeetingTokenError(error instanceof Error ? error.message : "LiveKit token could not be issued.");
    } finally {
      setMeetingTokenLoading(false);
    }
  }

  return (
    <main className="j-shell">
      <aside className={`j-premium-shell fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col overflow-y-auto border-r border-white/10 p-4 transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between">
          <Logo />
          <button className="rounded-md p-2 text-slate-300 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.055] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Current Workspace</p>
          <button className="mt-2 flex w-full items-center justify-between gap-3 text-left" onClick={() => setWorkspaceMenuOpen((current) => !current)} aria-expanded={workspaceMenuOpen} type="button">
            <p className="text-sm font-bold text-white">{personalWorkspaceTitle}</p>
            <ChevronDown size={16} className={`text-slate-300 transition ${workspaceMenuOpen ? "rotate-180" : ""}`} />
          </button>
          <p className="mt-2 text-xs font-bold text-amber-200">{electiveScopeLabel}</p>
          {campaignSlogan ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-300">&quot;{campaignSlogan}&quot;</p> : null}
          {!isOwnerAccount ? <p className="mt-1 text-xs font-semibold text-slate-400">Under {referenceCandidateName}</p> : null}
          <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400" />Active</p>
          {workspaceMenuOpen ? (
            <div className="mt-3 space-y-2 rounded-md border border-white/10 bg-slate-950/35 p-3 text-xs text-slate-300">
              <div className="flex justify-between gap-3"><span className="text-slate-400">Candidate</span><span className="text-right font-bold text-white">{referenceCandidateName}</span></div>
              <div className="flex justify-between gap-3"><span className="text-slate-400">Seat</span><span className="text-right font-bold text-amber-100">{campaignPosition}</span></div>
              <div className="flex justify-between gap-3"><span className="text-slate-400">Area</span><span className="text-right font-bold text-sky-100">{electiveScopeLabel}</span></div>
              <button className="mt-2 h-8 w-full rounded-md bg-white/10 text-xs font-black text-white hover:bg-white/15" onClick={() => scrollToSection("Settings")} type="button">Workspace Settings</button>
            </div>
          ) : null}
        </div>
        <nav className="mt-4 space-y-1">
          {visibleNavItems.map((item) => (
            <button
              key={item.label}
              onClick={() => scrollToSection(item.label)}
              className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-[12px] font-semibold transition ${activeSection === item.label ? "j-premium-nav-active" : "j-premium-nav"}`}
            >
              <item.icon size={16} />
              <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
              {"badge" in item ? <span className="rounded bg-amber-300 px-1.5 py-0.5 text-[10px] font-black text-slate-950">{item.badge}</span> : null}
            </button>
          ))}
        </nav>
        {isOwnerAccount ? (
          <div className="mt-auto rounded-lg border border-amber-400/55 bg-amber-400/5 p-3">
            <p className="flex items-center gap-2 text-xs font-black text-amber-300"><Trophy size={14} />Premium Plan</p>
            <p className="mt-2 text-xs text-slate-300">Expires on 24 Aug 2026</p>
            <div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-2 w-[78%] rounded-full bg-amber-400" /></div>
            <p className="mt-2 text-xs text-slate-300">71 days remaining</p>
            <button className="mt-3 h-9 w-full rounded-md border border-amber-300/50 text-xs font-bold text-amber-100 hover:bg-amber-300/10" onClick={() => scrollToSection("Subscriptions")} type="button">Manage Subscription</button>
          </div>
        ) : (
          <div className="mt-auto rounded-lg border border-sky-400/40 bg-sky-400/5 p-3">
            <p className="flex items-center gap-2 text-xs font-black text-sky-200"><UserCog size={14} />{roleProfile.badge} Account</p>
            <p className="mt-2 text-xs leading-5 text-slate-300">You are operating under the candidate workspace, not as the candidate owner.</p>
            <button className="mt-3 h-9 w-full rounded-md border border-sky-300/40 text-xs font-bold text-sky-100 hover:bg-sky-300/10" onClick={() => scrollToSection(profileSection)} type="button">Open My Tools</button>
          </div>
        )}
        <div className="mt-4 border-t border-white/10 pt-4">
          <button className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left hover:bg-white/10" onClick={() => setAccountMenuOpen((current) => !current)} aria-expanded={accountMenuOpen} type="button">
            <span className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-sm font-black text-slate-950">{currentMemberName.slice(0, 1)}</span>
              <span>
                <span className="block text-sm font-bold text-white">{currentMemberName}</span>
                <span className="block text-xs text-slate-400">{currentRole}</span>
              </span>
            </span>
            <ChevronDown size={16} className={`text-slate-300 transition ${accountMenuOpen ? "rotate-180" : ""}`} />
          </button>
          {accountMenuOpen ? (
            <div className="mt-2 grid gap-2 rounded-md border border-white/10 bg-white/[0.055] p-2">
              <button className="h-8 rounded-md px-2 text-left text-xs font-bold text-slate-200 hover:bg-white/10" onClick={() => scrollToSection(accountSection)} type="button">Open account workspace</button>
              <button className="h-8 rounded-md px-2 text-left text-xs font-bold text-slate-200 hover:bg-white/10" onClick={() => scrollToSection("Team & Roles")} type="button">Team & roles</button>
              <button className="h-8 rounded-md px-2 text-left text-xs font-bold text-red-200 hover:bg-red-500/10" onClick={() => void logout()} type="button">Logout</button>
            </div>
          ) : null}
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
                <input className="w-full bg-transparent outline-none placeholder:text-slate-400" onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search supporters, team, tasks, events..." value={searchQuery} />
                <span className="rounded bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">Ctrl K</span>
              </label>
              <button className="relative grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-white text-slate-950 shadow-sm" aria-label="Notifications" onClick={() => runAction("Opening internal notifications and audit trail.", "Audit Trail")} type="button">
                <Bell size={18} />
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[10px] font-black text-white">{unreadNotificationCount}</span>
              </button>
              <button className="relative grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-white text-slate-950 shadow-sm" aria-label="Messages" onClick={() => scrollToSection("Communications")} type="button">
                <MessageSquare size={18} />
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-[10px] font-black text-white">{openMessageCount}</span>
              </button>
              <button className="hidden h-10 items-center gap-3 rounded-md border-l border-slate-200 pl-3 text-left sm:inline-flex" onClick={() => scrollToSection(accountSection)} type="button">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-sm font-black text-slate-700 ring-1 ring-slate-200">{currentMemberName.slice(0, 1)}</span>
                <span>
                  <span className="block text-sm font-black text-slate-950">{currentMemberName}</span>
                  <span className="block text-xs font-semibold text-slate-600">{currentRole}</span>
                </span>
                <ChevronDown size={16} className="text-slate-700" />
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => void logout()} type="button">
                <X size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="j-workspace-content p-4 lg:p-6 xl:p-7">
          {searchQuery.trim() && globalSearchResults.length ? (
            <section className="mb-4 rounded-lg border border-sky-100 bg-white p-3 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-sky-700">Search results</p>
              <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {globalSearchResults.map((result) => (
                  <button key={`${result.type}-${result.title}-${result.detail}`} className="rounded-md bg-slate-50 p-3 text-left hover:bg-sky-50" onClick={() => scrollToSection(result.section)} type="button">
                    <p className="text-sm font-bold text-slate-950">{result.title}</p>
                    <p className="text-xs font-semibold text-sky-700">{result.type}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{result.detail}</p>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section id="dashboard" className={sectionClass("dashboard", "scroll-mt-24")}>
            <section className={`j-command-center mb-5 rounded-lg border border-amber-200/90 bg-gradient-to-br ${roleProfile.gradient} p-5 shadow-sm`}>
              <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr_1.45fr] lg:items-center">
                <div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700 ring-1 ring-blue-100">{roleProfile.badge}</span>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">{personalWorkspaceTitle}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{personalWorkspaceSubtitle}. {campaignSlogan ? `Slogan: "${campaignSlogan}"` : roleProfile.subtitle}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-md bg-slate-950 px-2.5 py-1 text-xs font-black text-white">{currentRole}</span>
                    {!isOwnerAccount ? <span className="rounded-md bg-sky-100 px-2.5 py-1 text-xs font-black text-sky-800">Assigned: {memberAssignmentLabel}</span> : null}
                    {campaignCounty ? <span className="rounded-md bg-white px-2.5 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">{campaignCounty} County</span> : null}
                    {campaignConstituency ? <span className="rounded-md bg-white px-2.5 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">{campaignConstituency} Constituency</span> : null}
                    {campaignWard ? <span className="rounded-md bg-white px-2.5 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">{campaignWard} Ward</span> : null}
                    <span className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">{focusAreas.length || focusWards.length} focus {focusAreaPlural}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {geographyLadder.map((step, index) => (
                      <span key={`${step}-${index}`} className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-black ${index === 0 ? "bg-blue-700 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}>
                        {index + 1}. {step}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="border-slate-200 lg:border-l lg:pl-6">
                  <p className="text-sm font-bold text-slate-700">{readinessLabel}</p>
                  <div className="mt-1 flex items-center gap-4">
                    <span className="text-3xl font-black text-amber-600">68%</span>
                    <span className="h-2 flex-1 rounded-full bg-slate-200">
                      <span className="block h-2 w-[68%] rounded-full bg-amber-500" />
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{readinessHelper}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {roleProfile.quickActions.slice(0, 4).map(([label, Icon, section], index) => (
                    <button key={label} className={`inline-flex h-12 items-center justify-center gap-2 rounded-md px-4 text-sm font-black shadow-sm transition ${index === 0 ? "bg-[#07111f] text-white hover:bg-[#0f1f34]" : "border border-slate-200 bg-white text-slate-800 hover:border-amber-300 hover:bg-amber-50"}`} onClick={() => scrollToSection(section)} type="button">
                      <Icon size={17} />
                      {label}
                    </button>
                  ))}
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
                  <button className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50" onClick={() => scrollToSection("Reports & Analytics")} type="button">Last 30 days <ChevronDown size={14} /></button>
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
                    <p className="font-black text-slate-800">{totalSupporters.toLocaleString()}</p>
                    <p className="text-slate-400">Live total</p>
                  </div>
                  <div className="absolute bottom-2 left-14 right-8 flex justify-between text-xs font-medium text-slate-400">
                    <span>May 20</span><span>May 27</span><span>Jun 3</span><span>Jun 10</span><span>Jun 17</span>
                  </div>
                </div>
              </section>

              <section className="j-dashboard-card rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="text-base font-black text-slate-950">Supporters by {focusAreaPlural} in {electiveScopeLabel}</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-[0.9fr_1fr] xl:grid-cols-1 2xl:grid-cols-[0.9fr_1fr]">
                  <div className="grid h-56 place-items-center">
                    <div className="grid h-40 w-40 place-items-center rounded-full" style={{ background: "conic-gradient(#1d6fff 0 25%, #d6a200 25% 40%, #16a34a 40% 53%, #7c3aed 53% 68%, #f97316 68% 80%, #d1d5db 80% 100%)" }}>
                      <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center shadow-sm">
                        <span>
                          <span className="block text-lg font-black text-slate-950">{totalSupporters.toLocaleString()}</span>
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
                  <h2 className="text-base font-black text-slate-950">Action Queue <span className="ml-1 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">{actionQueue.reduce((total, item) => total + item.value, 0)}</span></h2>
                </div>
                <div className="mt-4 grid grid-cols-2 rounded-md border border-slate-200 bg-slate-50 p-1 text-xs font-black">
                  <button className="rounded bg-white px-3 py-2 text-blue-700 shadow-sm" onClick={() => scrollToSection("Tasks & Field Ops")} type="button">Needs Action <span className="ml-1 rounded-full bg-blue-50 px-1.5 text-blue-700">{actionQueue.reduce((total, item) => total + item.value, 0)}</span></button>
                  <button className="rounded px-3 py-2 text-slate-500 hover:bg-white" onClick={() => scrollToSection("Reports & Analytics")} type="button">All Items <span className="ml-1 rounded-full bg-slate-200 px-1.5 text-slate-500">{actionQueue.length}</span></button>
                </div>
                <div className="mt-3 divide-y divide-slate-100">
                  {actionQueue.map((item) => (
                    <button key={item.label} className="flex w-full items-center justify-between gap-3 py-3 text-left" onClick={() => scrollToSection(item.section)} type="button">
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
                <button className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50" onClick={() => scrollToSection("Reports & Analytics")} type="button">View All Queue <ChevronDown className="-rotate-90" size={14} /></button>
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
                {isOwnerAccount ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <h2 className="text-base font-black text-slate-950">{currentRole} Scope</h2>
                    <div className="mt-4 rounded-lg border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4">
                      <p className="text-sm font-bold text-slate-950">{currentMemberName} working for {referenceCandidateName}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{personalWorkspaceSubtitle}. Your primary assignment is {memberAssignmentLabel}. Billing, ownership, and candidate profile controls remain with the candidate/admin account.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {allowedNavLabels.slice(0, 6).map((label) => (
                          <span key={label} className="rounded-md bg-white px-2 py-1 text-[11px] font-black text-sky-800 ring-1 ring-sky-100">{label}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white hover:bg-slate-900" onClick={() => scrollToSection(profileSection)} type="button"><UserCog size={16} />My Role Tools</button>
                      <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50" onClick={() => scrollToSection("Communications")} type="button"><MessageSquare size={16} />Contact Team</button>
                    </div>
                  </>
                )}
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
                      <button key={label} className="flex h-12 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-xs font-black text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700" onClick={() => section === "Logout" ? void logout() : scrollToSection(section)} type="button">
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
                  {[[`${focusAreaSingular}s Covered`, `${coverageRows.filter((row) => row.score > 0).length} / ${Math.max(coverageRows.length, focusAreas.length || focusWards.length || 1)}`], ["Field Visits", workspaceFieldVisitRows.length.toLocaleString()], ["Reports Submitted", liveAuditLogs.length.toLocaleString()], ["Issues Logged", workspaceIssueRows.length.toLocaleString()]].map(([label, value]) => (
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
                <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-black text-white shadow-sm hover:bg-blue-700" onClick={openPrimaryAction} type="button">
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
                  <p className="mt-1 text-lg font-bold text-sky-950">{workspaceSolco.status}</p>
                  <p className="mt-1 text-xs text-sky-800">{workspaceSolco.tokenEndpoint}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Solco Workspace</p>
                  <a className="mt-1 block truncate text-sm font-bold text-sky-700" href={workspaceSolco.workspaceUrl}>{workspaceSolco.workspaceUrl}</a>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">LiveKit Source</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">{workspaceSolco.livekitUrl}</p>
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
                    onClick={() => void issueMeetingToken(workspaceCommunicationRooms[0]?.livekitRoomName ?? "jukwaa-command-briefing")}
                    type="button"
                  >
                    <Video size={16} />
                    {meetingTokenLoading ? "Issuing" : "Issue LiveKit Token"}
                  </button>
                </div>
                {meetingTokenStatus ? <div className="mt-3 rounded-md bg-white p-3 text-sm font-semibold text-slate-700">{meetingTokenStatus}</div> : null}
                {meetingTokenError ? <div className="mt-3 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{meetingTokenError}</div> : null}
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <form className="rounded-lg border border-slate-200 p-3" onSubmit={(event) => { event.preventDefault(); void persistWorkflow("communicationRoom", { title: roomTitle, purpose: roomPurpose, audience: roomAudience || `${electiveScopeLabel} campaign team`, scheduledAt: roomSchedule, expectedParticipants: Number(roomParticipants) }, "Communication room created.", "Communications").then(() => { setRoomTitle(""); setRoomAudience(""); setRoomSchedule(""); setRoomParticipants("0"); }); }}>
                  <h3 className="text-sm font-black text-slate-950">Create Room</h3>
                  <div className="mt-3 grid gap-2">
                    <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setRoomTitle(event.target.value)} placeholder={`${electiveScopeLabel} command room`} required value={roomTitle} />
                    <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => setRoomPurpose(event.target.value)} value={roomPurpose}>
                      {["Command Briefing", "Volunteer Coordination", "Ward Town Hall", "Candidate Broadcast"].map((purpose) => <option key={purpose}>{purpose}</option>)}
                    </select>
                    <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setRoomAudience(event.target.value)} placeholder="Audience" value={roomAudience} />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setRoomSchedule(event.target.value)} type="datetime-local" value={roomSchedule} />
                      <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" min="0" onChange={(event) => setRoomParticipants(event.target.value)} placeholder="Expected" type="number" value={roomParticipants} />
                    </div>
                    <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white hover:bg-slate-900" type="submit"><Video size={16} />Create Room</button>
                  </div>
                </form>
                <form className="rounded-lg border border-slate-200 p-3" onSubmit={submitCampaignMessage}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-slate-950">SMS & WhatsApp Broadcast</h3>
                    <button className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-black text-sky-700 hover:bg-sky-50" onClick={useSupporterPhones} type="button">
                      Use supporter phones
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2">
                    <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setMessageSubject(event.target.value)} placeholder="Message subject" required value={messageSubject} />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => setMessageChannel(event.target.value)} value={messageChannel}>
                        {["Broadcast SMS", "WhatsApp", "Campaign Chat", "Solco Meeting"].map((channel) => <option key={channel}>{channel}</option>)}
                      </select>
                      <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => setMessageStatus(event.target.value)} value={messageStatus}>
                        {["Draft", "Queued", "Sent", "Delivered"].map((status) => <option key={status}>{status}</option>)}
                      </select>
                    </div>
                    <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setMessageAudience(event.target.value)} placeholder="Audience" value={messageAudience} />
                    <textarea
                      className="min-h-24 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
                      maxLength={1000}
                      onChange={(event) => setMessageBody(event.target.value)}
                      placeholder={`Write the message for ${electiveScopeLabel}`}
                      required
                      value={messageBody}
                    />
                    <textarea
                      className="min-h-20 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
                      onChange={(event) => setMessageRecipients(event.target.value)}
                      placeholder="+2547... one per line, comma, or semicolon"
                      value={messageRecipients}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500">
                      <span>{parseRecipientPhones(messageRecipients).length.toLocaleString()} recipient(s)</span>
                      <span>{messageBody.length}/1000 characters</span>
                    </div>
                    {messageDeliveryNotice ? <div className="rounded-md bg-sky-50 p-2 text-xs font-bold text-sky-800">{messageDeliveryNotice}</div> : null}
                    <button disabled={messageSending} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400" type="submit">
                      {messageChannel === "WhatsApp" ? <Smartphone size={16} /> : <MessageSquare size={16} />}
                      {messageSending ? "Processing" : messageChannel === "Broadcast SMS" || messageChannel === "WhatsApp" ? "Send / Open Composer" : "Save Message"}
                    </button>
                  </div>
                </form>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {workspaceCommunicationRooms.map((room) => (
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
                {workspaceCommunicationRooms.length === 0 ? emptyState("No communication rooms have been created for this workspace yet.") : null}
              </div>
            </div>

            <div id="communication-message-queue" className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Message Queue</h2>
                <ReportLink report="communication-messages" label="Messages" />
              </div>
              <div className="mt-4 space-y-3">
                {workspaceCommunicationMessages.map((message) => (
                  <div key={message.id} className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{message.subject}</p>
                        <p className="text-xs text-slate-500">{message.channel} - {message.audience}</p>
                      </div>
                      <StatusPill label={message.deliveryStatus || message.status} />
                    </div>
                    {message.body ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">{message.body}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                      <span>{message.sender} - {message.sentAt || "Not sent"}</span>
                      <span>{message.recipientCount.toLocaleString()} recipient(s)</span>
                      {message.providerName ? <span>{message.providerName}</span> : null}
                    </div>
                    {message.deliveryError ? <p className="mt-2 rounded-md bg-amber-50 p-2 text-xs font-bold text-amber-800">{message.deliveryError}</p> : null}
                  </div>
                ))}
                {workspaceCommunicationMessages.length === 0 ? emptyState("No campaign messages have been queued yet.") : null}
              </div>
            </div>
          </section>

          <section id="ai-assistant" className={sectionClass("ai-assistant", "scroll-mt-24 grid gap-4 xl:grid-cols-3")}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">JUKWAA AI Campaign Assistant</h2>
                  <p className="text-sm text-slate-500">Natural-language intelligence, strategy ranking, reports, content drafts, risks, and opportunities.</p>
                  {liveBootstrap && !liveBootstrap.ai?.configured ? <p className="mt-1 text-xs font-bold text-amber-700">OpenAI is not configured yet. Add OPENAI_API_KEY before live AI answers can work.</p> : null}
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
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    `Which ${focusAreaPlural} in ${electiveScopeLabel} need attention this week?`,
                    `Draft a speech paragraph about ${effectiveFocusArea.label || effectiveSupporterWard || electiveScopeLabel} issues.`,
                    `Create a WhatsApp update for ${electiveScopeLabel} volunteers.`,
                    `Summarize open manifesto issues by ward.`,
                  ].map((prompt) => (
                    <button key={prompt} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700" onClick={() => setAiQuestion(prompt)} type="button">
                      {prompt}
                    </button>
                  ))}
                  <button disabled={!aiAnswer.trim()} className="rounded-md bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300" onClick={() => void persistWorkflow("aiContent", { title: aiQuestion.slice(0, 80), assetType: "AI Strategy Brief", audience: electiveScopeLabel }, "AI answer saved as campaign content.", "AI Campaign Studio")} type="button">
                    Save AI Draft
                  </button>
                </div>
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
                {workspaceAiContentAssets.map((asset) => (
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
                {workspaceAiContentAssets.length === 0 ? emptyState("No AI content drafts have been saved yet. Ask AI, then save useful drafts as campaign content.") : null}
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
                {emptyState(`No live donations have been recorded for ${personalWorkspaceTitle} yet.`)}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Expenses and Approvals</h2>
                <ReportLink report="expenses" label="Expenses" />
              </div>
              <div className="mt-4 space-y-3">
                {emptyState(`No live expenses have been entered for ${personalWorkspaceTitle} yet.`)}
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
                {budgetRows.length === 0 ? emptyState(`No budget records have been entered for ${personalWorkspaceTitle} yet.`) : null}
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
                <p className="mt-1 text-sm text-amber-800">Business number: 4080665</p>
                <p className="mt-1 text-xs text-amber-700">Set the live Paybill in secure production settings before processing real payments.</p>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Link className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-3 text-sm font-bold text-white hover:bg-slate-900" href="/payment/confirm">Confirm Payment</Link>
                <Link className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50" href="/admin/activation">Activate Workspace</Link>
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                <div className="rounded-md bg-slate-50 p-3">Account reference: <b>{liveBootstrap?.workspace.candidateId ? `JUKWAA-${liveBootstrap.workspace.candidateId.slice(0, 8).toUpperCase()}` : "Created after login"}</b></div>
                <div className="rounded-md bg-slate-50 p-3">STK Push: <b>{liveBootstrap ? "Ready" : "Checking"}</b></div>
                <div className="rounded-md bg-slate-50 p-3">Paybill: <b>Ready</b></div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Transaction Logs</h2>
              <div className="mt-4 space-y-3">
                {emptyState(`No live M-Pesa transactions have been recorded for ${personalWorkspaceTitle} yet.`)}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Fundraising Campaigns</h2>
                <ReportLink report="fundraising" label="Fundraising" />
              </div>
              <div className="mt-4 space-y-3">
                {emptyState(`No fundraising campaigns have been created for ${electiveScopeLabel} yet.`)}
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
                {aiRows.map((insight) => (
                  <div key={insight.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-slate-950">{insight.title}</p>
                      <span className="text-lg font-bold text-sky-700">{insight.impactScore}/100</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{insight.description}</p>
                    <p className="mt-2 text-xs text-slate-500">{insight.source}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Scenario Planning</h2>
              <div className="mt-4 space-y-3">
                {emptyState(`No scenario plans have been created from live ${electiveScopeLabel} data yet.`)}
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
                {emptyState(`No campaign documents have been uploaded for ${personalWorkspaceTitle} yet.`)}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Knowledge Center</h2>
              <div className="mt-4 space-y-3">
                {emptyState(`No training articles have been published for this workspace yet.`)}
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
                {[{
                  id: liveBootstrap?.workspace.candidateId || "current-candidate",
                  fullName: referenceCandidateName,
                  positionContesting: campaignPosition,
                  constituency: electiveScopeLabel,
                  verificationStatus: liveBootstrap?.campaign?.active_status || "Active",
                  biography: campaignSlogan || `Candidate workspace for ${electiveScopeLabel}.`,
                  campaignName: personalWorkspaceTitle,
                  activeStatus: commercialAccess?.allowed ? "Workspace active" : commercialAccess?.status || "Awaiting activation",
                  phoneNumber: "Login account contact",
                  politicalParty: liveBootstrap?.campaign?.political_party || "Not recorded",
                }].map((candidate) => (
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
                      <p className="text-sm font-bold text-slate-950">{liveBootstrap?.campaign?.slogan || candidateBranding.slogan}</p>
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
                <StatusPill label={commercialAccess?.allowed ? "Active" : commercialAccess?.status || "Pending"} />
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Owner</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">{referenceCandidateName}</p>
                  <p className="mt-1 text-xs text-slate-500">Candidate cannot be deleted from their workspace.</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Secondary Owner</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">{workspaceInvitations.find((invite) => invite.role.includes("Manager") && invite.status === "Accepted")?.invitedName || "No accepted campaign manager yet"}</p>
                  <p className="mt-1 text-xs text-slate-500">Invite a campaign manager from Team & Roles when ready.</p>
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
                    Invite Team Member
                  </Link>
                  <ReportLink report="invitations" label="Invites" />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {workspaceInvitations.map((invite) => (
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
                {workspaceInvitations.length === 0 ? emptyState(`No team invitations have been created for ${electiveScopeLabel} yet.`) : null}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Election Management</h2>
                <StatusPill label={`${workspaceElectionRows.filter((election) => election.status === "Active").length} Active`} />
              </div>
              <div className="mt-4 space-y-3">
                {workspaceElectionRows.map((election) => (
                  <div key={election.id} className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{election.electionName}</p>
                        <p className="text-xs text-slate-500">{election.electionType} - {election.geography}</p>
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
                  <button key={action} disabled={!pendingInvitationId} className="flex h-11 items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => void persistWorkflow("userStatus", { invitationId: pendingInvitationId, status: action.includes("Approve") ? "Accepted" : action.includes("Reactivate") ? "Pending" : "Revoked" }, `${action} workflow saved to the audit trail.`, "Users")} type="button">
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
                <p className="mt-1 text-2xl font-bold text-slate-950">{commercialAccess?.subscriptionStatus || "Workspace Plan"}</p>
                <p className="mt-1 text-sm text-slate-500">{commercialAccess?.reason || "Subscription and access state comes from the live workspace."}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-white p-2"><b>{workspaceUserRows.length}</b><br />users</div>
                  <div className="rounded-md bg-white p-2"><b>{totalVolunteers}</b><br />volunteers</div>
                  <div className="rounded-md bg-white p-2"><b>{totalPollingAgents}</b><br />agents</div>
                  <div className="rounded-md bg-white p-2"><b>{commercialAccess?.paymentStatus || "Pending"}</b><br />payment</div>
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
                {emptyState(`No payment records have been received for ${personalWorkspaceTitle} yet.`)}
                <p className="text-xs text-slate-500">{liveBootstrap?.summary.payments ?? 0} live payment records tracked for this workspace.</p>
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
                {workspaceSecurityEvents.map((event) => (
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
                {workspaceSecurityEvents.length === 0 ? emptyState("No audit/security events have been recorded yet.") : null}
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
                {workspaceIssueRows.filter((issue) => issue.priority === "High" || issue.priority === "Critical").map((issue) => (
                  <div key={issue.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{issue.title}</p>
                        <p className="text-xs text-slate-500">{issue.meta}</p>
                      </div>
                      <StatusPill label={issue.priority} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{issue.description}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{issue.status}</p>
                  </div>
                ))}
                {workspaceIssueRows.filter((issue) => issue.priority === "High" || issue.priority === "Critical").length === 0 ? emptyState(`No high-priority situation alerts for ${electiveScopeLabel} yet.`) : null}
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
                {workspaceIssueRows.map((incident) => (
                  <div key={incident.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{incident.title}</p>
                        <p className="text-xs text-slate-500">{incident.meta}</p>
                      </div>
                      <StatusPill label={incident.priority} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{incident.description}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{incident.status} - {incident.mentions} mentions</p>
                  </div>
                ))}
                {workspaceIssueRows.length === 0 ? emptyState(`No incidents or issues have been reported for ${electiveScopeLabel} yet.`) : null}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Forms and Validation</h2>
                <ReportLink report="results" label="Results" />
              </div>
              <div className="mt-4 space-y-3">
                {qualityQueue.map((form) => (
                  <div key={`${form.station}-${form.formType}`} className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{form.station}</p>
                        <p className="text-xs text-slate-500">{form.formType} - {form.uploadedBy}</p>
                      </div>
                      <StatusPill label={form.status} />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{form.flags}</p>
                  </div>
                ))}
                {qualityQueue.length === 0 ? emptyState("No result forms have been uploaded for validation yet.") : null}
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
                {workspaceResultCards.map((result) => (
                  <div key={result.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-bold text-slate-950">{result.candidate}</p>
                    <p className="text-xs text-slate-500">{result.pollingStation}</p>
                    <p className="mt-3 text-2xl font-bold text-slate-950">{result.votes.toLocaleString()}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{result.totalVotes.toLocaleString()} total votes - {result.rejectedVotes} rejected</p>
                    <div className="mt-3"><StatusPill label={result.verificationStatus} /></div>
                  </div>
                ))}
                {workspaceResultCards.length === 0 ? emptyState("No PVT or polling result records have been submitted yet.") : null}
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
                {mobilizationRows.length === 0 ? emptyState(`No supporter intelligence is available for ${electiveScopeLabel} yet.`) : null}
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-4">
            <ChartCard
              title="Volunteer Performance"
              report="volunteer-performance"
              accent="emerald"
              hasData={volunteerRows.length > 0}
              insight={`${volunteerRows.length.toLocaleString()} volunteer record(s) are active in ${electiveScopeLabel}. Use this to spot field leaders and weak coverage zones.`}
              stats={[
                { label: "Volunteers", value: volunteerRows.length.toLocaleString() },
                { label: "Active", value: volunteerRows.filter((row) => row.status === "Active").length.toLocaleString() },
                { label: "Avg Score", value: volunteerRows.length ? Math.round(volunteerRows.reduce((sum, row) => sum + row.score, 0) / volunteerRows.length) : 0 },
              ]}
            >
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
            <ChartCard
              title={`${electiveScopeLabel} Coverage`}
              report="territory-coverage"
              accent="sky"
              hasData={coverageRows.some((row) => row.score > 0)}
              insight={`Coverage is calculated from supporters, visits, events, and issues inside ${electiveScopeLabel}.`}
              stats={[
                { label: focusAreaPlural, value: coverageRows.length.toLocaleString() },
                { label: "Covered", value: coverageRows.filter((row) => row.score > 0).length.toLocaleString() },
                { label: "Needs Activity", value: coverageRows.filter((row) => row.status === "Needs activity").length.toLocaleString() },
              ]}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coverageRows}>
                  <XAxis dataKey="name" hide />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard
              title="Event Attendance Trends"
              report="event-attendance"
              accent="amber"
              hasData={eventTrend.length > 0}
              insight={`Track whether rallies, town halls, and meetings are building momentum across ${electiveScopeLabel}.`}
              stats={[
                { label: "Events", value: eventTrend.length.toLocaleString() },
                { label: "Expected", value: eventTrend.reduce((sum, row) => sum + row.expected, 0).toLocaleString() },
                { label: "Projected", value: eventTrend.reduce((sum, row) => sum + row.actual, 0).toLocaleString() },
              ]}
            >
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
            <ChartCard
              title={`${electiveScopeLabel} Issues`}
              report="community-issues"
              accent="red"
              hasData={issueBreakdown.some((row) => row.value > 0)}
              insight={`This is the manifesto pressure map for ${electiveScopeLabel}: what people are raising, and where follow-up is needed.`}
              stats={[
                { label: "Issues", value: liveIssues.length.toLocaleString() },
                { label: "Categories", value: issueBreakdown.filter((row) => row.value > 0).length.toLocaleString() },
                { label: "Open", value: liveIssues.filter((issue) => liveText(issue, "status", "Open") === "Open").length.toLocaleString() },
              ]}
            >
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
            <ChartCard
              title={`Supporters by ${focusAreaPlural}`}
              report="supporters-by-area"
              accent="sky"
              hasData={wardData.some((row) => row.value > 0)}
              insight={`Supporter distribution is scoped to ${electiveScopeLabel}, so each candidate sees the right counties, constituencies, wards, or local units.`}
              stats={[
                { label: "Supporters", value: totalSupporters.toLocaleString() },
                { label: focusAreaPlural, value: wardData.length.toLocaleString() },
                { label: "Top Area", value: [...wardData].sort((a, b) => b.value - a.value)[0]?.name ?? "None" },
              ]}
            >
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
            <ChartCard
              title="Support Levels"
              report="support-levels"
              accent="violet"
              hasData={supportLevelData.some((row) => row.value > 0)}
              insight="This shows persuasion health: strong supporters, leaners, undecided voters, opponents, and unclassified records."
              stats={[
                { label: "Strong", value: workspaceSupporters.filter((supporter) => supporter.supportLevel === "Strong Supporter").length.toLocaleString() },
                { label: "Undecided", value: workspaceSupporters.filter((supporter) => supporter.supportLevel === "Undecided").length.toLocaleString() },
                { label: "Unknown", value: workspaceSupporters.filter((supporter) => supporter.supportLevel === "Unknown").length.toLocaleString() },
              ]}
            >
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
            <ChartCard
              title="Top Community Issues"
              report="community-issues"
              accent="red"
              hasData={issueData.some((row) => row.value > 0)}
              insight={`Use this to connect ${electiveScopeLabel} messaging, manifesto promises, and field follow-up to real supporter concerns.`}
              stats={[
                { label: "Issue Tags", value: issueData.length.toLocaleString() },
                { label: "Supporters Tagged", value: workspaceSupporters.filter((supporter) => supporter.keyIssue !== "Not recorded").length.toLocaleString() },
                { label: "Top Issue", value: [...issueData].sort((a, b) => b.value - a.value)[0]?.name ?? "None" },
              ]}
            >
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
            <ChartCard
              title="Gender Distribution"
              report="supporter-demographics"
              accent="emerald"
              hasData={genderData.some((row) => row.value > 0)}
              insight={`Demographics help the ${electiveScopeLabel} team balance outreach across all voter groups without guessing.`}
              stats={[
                { label: "Recorded", value: genderData.reduce((sum, row) => sum + row.value, 0).toLocaleString() },
                { label: "Groups", value: genderData.filter((row) => row.value > 0).length.toLocaleString() },
                { label: "Missing", value: workspaceSupporters.filter((supporter) => supporter.gender === "Not recorded").length.toLocaleString() },
              ]}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genderData}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard
              title="Age Distribution"
              report="supporter-demographics"
              accent="amber"
              hasData={ageData.some((row) => row.value > 0)}
              insight="Age distribution gives the campaign a sharper picture for youth outreach, women groups, elders, and family-level mobilization."
              stats={[
                { label: "Recorded", value: ageData.reduce((sum, row) => sum + row.value, 0).toLocaleString() },
                { label: "Groups", value: ageData.filter((row) => row.value > 0).length.toLocaleString() },
                { label: "Missing", value: workspaceSupporters.filter((supporter) => supporter.ageGroup === "Not recorded").length.toLocaleString() },
              ]}
            >
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
                    {visibleSupporters.slice(0, 50).map((supporter) => (
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

            <div id="supporter-form" className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Quick Add Supporter</h2>
              <p className="mt-1 text-sm text-slate-500">Capture supporters inside {electiveScopeLabel}. Area options follow the candidate&apos;s elective level.</p>
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
                  {focusAreaSingular} in {electiveScopeLabel}
                  {focusAreas.length ? (
                    <select className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => setSupporterWard(event.target.value)} value={effectiveFocusArea.label}>
                      {focusAreas.map((area) => <option key={area.label}>{area.label}</option>)}
                    </select>
                  ) : (
                    <input value={supporterWard} onChange={(event) => setSupporterWard(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" placeholder={`${focusAreaSingular} or local area`} />
                  )}
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Village / estate
                    <input value={supporterVillage} onChange={(event) => setSupporterVillage(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" placeholder="Optional smaller unit" />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Polling station
                    <input value={supporterPollingStation} onChange={(event) => setSupporterPollingStation(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" placeholder="Optional station" />
                  </label>
                </div>
                <label className="block text-sm font-semibold text-slate-700">
                  Support level
                  <select className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" onChange={(event) => setSupportLevel(event.target.value as SupportLevel)} value={supportLevel}>
                    {Object.keys(supportColors).map((level) => <option key={level}>{level}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Key issue
                  <input value={supporterKeyIssue} onChange={(event) => setSupporterKeyIssue(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" placeholder={`Issue in ${effectiveSupporterWard || electiveScopeLabel}`} />
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
                <button disabled={!name.trim() || phone.replace(/\D/g, "").length < 7 || (duplicate && !overrideDuplicate)} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300" onClick={() => void persistWorkflow("supporter", { fullName: name, phoneNumber: phone, supportLevel, ...selectedLocationPayload, villageName: supporterVillage, pollingStationName: supporterPollingStation, keyIssue: supporterKeyIssue, consentToContact: true, notes: overrideDuplicate ? "Duplicate override approved." : "" }, `${name.trim() || "Supporter"} saved in ${effectiveFocusArea.label || effectiveSupporterWard || electiveScopeLabel}.`, "Supporters")} type="button">
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
                <div className="flex flex-wrap gap-2">
                  <ReportLink report="volunteer-performance" label="Performance Report" />
                  <Link className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white hover:bg-slate-900" href="/signup/user">
                    <Plus size={15} />
                    Invite Volunteer
                  </Link>
                </div>
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
                    {volunteerRows.map((row) => (
                        <tr key={row.name} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-950">{row.name}</p>
                            <p className="text-xs text-slate-500">{row.phoneNumber}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{row.area}</td>
                          <td className="px-4 py-3 text-slate-600">{row.assignedSupervisor}</td>
                          <td className="px-4 py-3"><StatusPill label={row.status} /></td>
                          <td className="px-4 py-3 text-slate-600">{row.supportersRegistered}</td>
                          <td className="px-4 py-3 text-slate-600">{row.activitiesCompleted}</td>
                          <td className="px-4 py-3 font-bold text-sky-700">{row.score}</td>
                        </tr>
                    ))}
                    {volunteerRows.length === 0 ? (
                      <tr><td className="px-4 py-6 text-center text-sm font-semibold text-slate-500" colSpan={7}>No volunteers have been invited or created yet.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div id="field-operations" className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Tasks & Field Operations</h2>
              <p className="mt-1 text-sm text-slate-500">Create work for the provisioned volunteer team, then record field activity.</p>
              <form className="mt-4 grid gap-2" onSubmit={(event) => { event.preventDefault(); void persistWorkflow("task", { title: taskTitle, description: taskDescription, dueDate: taskDueDate }, "Task created and assigned to the next available volunteer.", "Tasks & Field Ops"); }}>
                <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setTaskTitle(event.target.value)} placeholder="Task title" required value={taskTitle} />
                <textarea className="min-h-20 rounded-md border border-slate-200 p-3 text-sm" onChange={(event) => setTaskDescription(event.target.value)} placeholder="Instructions (optional)" value={taskDescription} />
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" min={new Date().toISOString().slice(0, 10)} onChange={(event) => setTaskDueDate(event.target.value)} required type="date" value={taskDueDate} />
                  <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white hover:bg-slate-900" type="submit"><CheckCircle2 size={16} />Create Task</button>
                </div>
              </form>
              <p className="mt-4 text-sm font-bold text-slate-950">60-Second Field Actions</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  ["Register Supporter", Users],
                  ["Submit Issue", AlertTriangle],
                  ["Submit Field Visit", Navigation],
                  ["Upload Photo", Camera],
                  ["Complete Task", CheckCircle2],
                  ["Report Intelligence", Radio],
                ].map(([label, Icon]) => (
                  <button key={String(label)} className="flex min-h-20 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left text-sm font-bold text-slate-800 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800" onClick={() => void persistWorkflow(String(label) === "Register Supporter" ? "supporter" : String(label) === "Submit Issue" ? "issue" : String(label) === "Submit Field Visit" ? "fieldVisit" : String(label) === "Complete Task" ? "task" : String(label) === "Report Intelligence" ? "supportTicket" : "supportTicket", String(label) === "Register Supporter" ? { fullName: "New supporter", phoneNumber: `+2547${Math.floor(10000000 + Math.random() * 89999999)}`, supportLevel: "Unknown", ...selectedLocationPayload, villageName: supporterVillage, pollingStationName: supporterPollingStation, consentToContact: true } : String(label) === "Submit Issue" ? { title: `New ${electiveScopeLabel} community issue`, category: "Other", priority: "Medium", ...selectedLocationPayload, villageName: supporterVillage, pollingStationName: supporterPollingStation } : String(label) === "Submit Field Visit" ? { visitPurpose: `Field activity in ${effectiveFocusArea.label || effectiveSupporterWard || electiveScopeLabel}`, supportersEngaged: 0, ...selectedLocationPayload, villageName: supporterVillage, pollingStationName: supporterPollingStation } : String(label) === "Complete Task" ? { title: `Follow-up task for ${effectiveFocusArea.label || effectiveSupporterWard || electiveScopeLabel}`, dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) } : { title: String(label), description: `Submitted from ${electiveScopeLabel} field action panel.`, priority: "Medium" }, `${String(label)} saved for ${effectiveFocusArea.label || effectiveSupporterWard || electiveScopeLabel}.`, "Field Operations")} type="button">
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
                  {workspaceTaskRows.slice(0, 4).map((task) => (
                    <div key={task.id} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 p-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{task.title}</p>
                        <p className="text-xs text-slate-500">due {task.dueDate}</p>
                      </div>
                      <StatusPill label={task.status} />
                    </div>
                  ))}
                  {workspaceTaskRows.length === 0 ? emptyState("No tasks have been created yet.") : null}
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
                {workspaceFieldVisitRows.map((visit) => (
                  <div key={visit.id} className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-slate-950">{visit.volunteer}</p>
                      <span className="font-mono text-xs text-slate-500">{visit.latitude.toFixed(4)}, {visit.longitude.toFixed(4)}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{visit.description}</p>
                    <p className="mt-2 text-xs text-slate-500">{visit.supportersEngaged} engaged - {visit.dateLabel}</p>
                  </div>
                ))}
                {workspaceFieldVisitRows.length === 0 ? emptyState("No field visits have been submitted yet.") : null}
              </div>
            </div>

            <div id="events-rallies" className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Create Event</h2>
              <form className="mt-4 grid gap-2" onSubmit={(event) => { event.preventDefault(); void persistWorkflow("event", { title: eventTitle, venue: eventVenue, eventDate, expectedAttendance: Number(eventAttendance) }, "Campaign event created.", "Events"); }}>
                <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setEventTitle(event.target.value)} placeholder="Event title" required value={eventTitle} />
                <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setEventVenue(event.target.value)} placeholder="Venue" required value={eventVenue} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" min={new Date().toISOString().slice(0, 10)} onChange={(event) => setEventDate(event.target.value)} required type="date" value={eventDate} />
                  <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" min="0" onChange={(event) => setEventAttendance(event.target.value)} placeholder="Expected attendance" type="number" value={eventAttendance} />
                </div>
                <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white hover:bg-slate-900" type="submit"><CalendarDays size={16} />Create Event</button>
              </form>
              <h2 className="mt-6 text-sm font-bold text-slate-950">Volunteer Leaderboard</h2>
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
              <form className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3" onSubmit={(event) => { event.preventDefault(); void persistWorkflow("issue", { title: issueTitle, category: issueCategory, priority: issuePriority, description: issueDescription, ...selectedLocationPayload, villageName: supporterVillage, pollingStationName: supporterPollingStation }, "Issue saved and added to manifesto follow-up.", "Issues & Manifesto").then(() => { setIssueTitle(""); setIssueDescription(""); setIssueCategory("Other"); setIssuePriority("Medium"); }); }}>
                <h3 className="text-sm font-black text-slate-950">Report Issue in {effectiveFocusArea.label || effectiveSupporterWard || electiveScopeLabel}</h3>
                <div className="mt-3 grid gap-2">
                  <input className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => setIssueTitle(event.target.value)} placeholder="Issue title" required value={issueTitle} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => setIssueCategory(event.target.value)} value={issueCategory}>
                      {["Roads", "Water", "Education", "Healthcare", "Agriculture", "Youth Employment", "Security", "Electricity", "Business", "Environment", "Other"].map((category) => <option key={category}>{category}</option>)}
                    </select>
                    <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => setIssuePriority(event.target.value)} value={issuePriority}>
                      {["Low", "Medium", "High", "Critical"].map((priority) => <option key={priority}>{priority}</option>)}
                    </select>
                  </div>
                  <textarea className="min-h-20 rounded-md border border-slate-200 bg-white p-3 text-sm" onChange={(event) => setIssueDescription(event.target.value)} placeholder="What residents are saying, pledge link, or action needed" value={issueDescription} />
                  <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white hover:bg-slate-900" type="submit"><AlertTriangle size={16} />Save Issue</button>
                </div>
              </form>
              <div className="mt-4 space-y-3">
                {workspaceIssueRows.map((issue) => (
                  <div key={issue.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{issue.title}</p>
                        <p className="text-xs text-slate-500">{issue.meta}</p>
                      </div>
                      <StatusPill label={issue.priority} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{issue.description}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{issue.mentions} mentions - {issue.status}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {(["Open", "Under Review", "Addressed"] as const).map((status) => (
                        <button key={status} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700" onClick={() => void persistWorkflow("issueStatus", { issueId: issue.id, status }, `Issue marked ${status}.`, "Issues & Manifesto")} type="button">
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {workspaceIssueRows.length === 0 ? emptyState("No community issues have been reported yet.") : null}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Events & Rallies</h2>
                <ReportLink report="event-attendance" label="Attendance" />
              </div>
              <div className="mt-4 space-y-3">
                {workspaceEventRows.map((event) => (
                  <div key={event.id} className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{event.title}</p>
                        <p className="text-xs text-slate-500">{event.meta}</p>
                      </div>
                      <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-600">{event.badge}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{event.venue}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">Expected {event.expectedAttendance.toLocaleString()}</p>
                  </div>
                ))}
                {workspaceEventRows.length === 0 ? emptyState("No campaign events have been created yet.") : null}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-950">Ground Intelligence</h2>
                <ReportLink report="ground-intelligence-summary" label="Intel" />
              </div>
              <div className="mt-4 space-y-3">
                {workspaceIntelligenceRows.map((report) => (
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
                {workspaceIntelligenceRows.length === 0 ? emptyState(`No ground intelligence has been captured for ${electiveScopeLabel} yet.`) : null}
              </div>
            </div>
          </section>

          <section id="reports" className={sectionClass("reports", "scroll-mt-24 grid gap-4 xl:grid-cols-3")}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Internal Notifications</h2>
              <div className="mt-4 space-y-3">
                {workspaceNotifications.map((notification) => (
                  <div key={notification.title} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-sm font-bold text-slate-950">{notification.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{notification.detail}</p>
                  </div>
                ))}
                {workspaceNotifications.length === 0 ? emptyState("No internal notifications yet.") : null}
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
                <ReportLink report="ward-activity" label={`${focusAreaSingular} Activity Report`} />
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
                {workspaceUserRows.map((user) => (
                  <div key={user.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.role} - {user.geography}</p>
                    </div>
                    <span className="text-xs font-bold text-sky-700">{user.status}</span>
                  </div>
                ))}
                {workspaceUserRows.length === 0 ? emptyState(`No users have been added for ${personalWorkspaceTitle} yet.`) : null}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">Audit Trail</h2>
              <div className="mt-4 space-y-3">
                {workspaceAuditRows.map((event) => (
                  <div key={event.id} className="border-l-2 border-sky-500 pl-3">
                    <p className="text-sm font-bold text-slate-950">{event.action} - {event.module}</p>
                    <p className="text-xs text-slate-500">{event.user} at {event.timestamp}</p>
                  </div>
                ))}
                {workspaceAuditRows.length === 0 ? emptyState(`No audit events have been recorded for ${personalWorkspaceTitle} yet.`) : null}
              </div>
            </div>
          </section>

          <section id="locations" className={sectionClass("locations", "scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4 shadow-sm")}>
            <h2 className="text-sm font-bold text-slate-950">Reusable Location Hierarchy and Report Catalog</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Country {"->"} County {"->"} Constituency {"->"} Ward {"->"} Village {"->"} Polling Station</div>
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Role geography assignment supports constituency, ward, village, and station scoping.</div>
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">{workspaceUserRows.length} live workspace users mapped for campaign operations.</div>
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">{issueData.length} live issue groups available for export.</div>
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
