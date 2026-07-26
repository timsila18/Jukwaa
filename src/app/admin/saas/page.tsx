"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, Copy, CreditCard, Download, Edit3, KeyRound, Phone, Plus, RefreshCcw, Save, ShieldCheck, Trash2, Users, WalletCards, XCircle } from "lucide-react";

type SaasWorkspace = {
  tenantId: string;
  candidateId: string;
  candidateName: string;
  email: string | null;
  phoneNumber: string;
  campaignName: string;
  position: string;
  politicalParty: string | null;
  candidateStatus: string;
  verificationStatus: string;
  application?: {
    id: string;
    status: string;
    plan: string;
    amount_due_kes: number;
    payment_reference: string | null;
    submitted_at: string;
  } | null;
  subscription?: {
    id: string;
    plan: string;
    status: string;
    expiry_date: string;
    user_limit: number;
    volunteer_limit: number;
    polling_agent_limit: number;
  } | null;
  latestPayment?: {
    id: string;
    amount_kes: number;
    status: string;
    channel: string;
    account_reference: string;
    submitted_at: string;
  } | null;
  pendingPayment?: { id: string; status: string } | null;
  accessStatus: "Locked" | "Unlocked";
  openTickets: number;
};

type SaasSnapshot = {
  summary: {
    tenants: number;
    workspaces: number;
    locked: number;
    activeSubscriptions: number;
    pendingPayments: number;
    confirmedPayments: number;
    openTickets: number;
    platformAdmins: number;
    revenueKes: number;
  };
  workspaces: SaasWorkspace[];
  applications: Array<{ id: string; campaign_name: string; full_name: string; status: string; amount_due_kes: number; payment_reference: string | null; submitted_at: string; tenant_id: string | null; candidate_id: string | null }>;
  payments: Array<{ id: string; tenant_id: string | null; candidate_id: string | null; onboarding_application_id: string | null; amount_kes: number; channel: string; account_reference: string; mpesa_receipt_number: string | null; status: string; submitted_at: string }>;
  subscriptions: Array<{ id: string; tenant_id: string; candidate_id: string; plan: string; status: string; expiry_date: string }>;
  tickets: Array<{ id: string; tenant_id: string | null; candidate_id: string | null; title: string; description: string | null; status: string; priority: string; created_at: string }>;
  platformAdmins: Array<{ id: string; email: string; full_name: string; status: string; created_at: string }>;
  campaignMembers: Array<{ id: string; tenant_id: string; candidate_id: string; full_name: string | null; email: string | null; role: string | null; status: string | null }>;
};

type OutreachStatus = "New" | "Contacted" | "Follow-up" | "Demo booked" | "Demo done" | "Converted" | "Not interested";

type OutreachLead = {
  id: string;
  name: string;
  seat: string;
  contact: string | null;
  phoneNumber: string | null;
  status: OutreachStatus;
  demoDate: string | null;
  outcome: string | null;
  nextFollowUp: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type OutreachState = {
  leads: OutreachLead[];
  summary: {
    total: number;
    contacted: number;
    demosBooked: number;
    converted: number;
    followUpsDue: number;
  };
  storage?: string;
};

const emptyOutreachForm = {
  name: "",
  seat: "Governor",
  contact: "WhatsApp",
  phoneNumber: "",
  status: "New" as OutreachStatus,
  demoDate: "",
  outcome: "",
  nextFollowUp: "",
  notes: "",
};

function money(value: number) {
  return `KES ${Math.round(value).toLocaleString()}`;
}

function dateText(value?: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
}

function statusClass(status: string) {
  if (["Active", "Activated", "Confirmed", "Unlocked", "Verified", "Resolved", "Closed", "Paid"].includes(status)) return "bg-emerald-50 text-emerald-700";
  if (["Locked", "Pending", "Payment Pending", "Payment Submitted", "Trial", "Past Due", "Issued", "Open", "In Progress"].includes(status)) return "bg-amber-50 text-amber-800";
  if (["Suspended", "Cancelled", "Rejected", "Failed", "Expired", "Overdue"].includes(status)) return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-700";
}

function Status({ value }: { value: string }) {
  return <span className={`rounded-md px-2 py-1 text-xs font-black ${statusClass(value)}`}>{value}</span>;
}

function outreachStatusClass(status: OutreachStatus) {
  if (status === "Converted") return "bg-emerald-50 text-emerald-800 ring-emerald-100";
  if (status === "Demo booked" || status === "Demo done") return "bg-sky-50 text-sky-800 ring-sky-100";
  if (status === "Contacted" || status === "Follow-up") return "bg-amber-50 text-amber-800 ring-amber-100";
  if (status === "Not interested") return "bg-red-50 text-red-700 ring-red-100";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function Kpi({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Users }) {
  return (
    <section className="j-kpi p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-100">
          <Icon size={19} />
        </div>
      </div>
    </section>
  );
}

export default function SaasAdminPage() {
  const [snapshot, setSnapshot] = useState<SaasSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [query, setQuery] = useState("");
  const [workspaceView, setWorkspaceView] = useState<"queue" | "all">("queue");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [resetWorkspaceId, setResetWorkspaceId] = useState("");
  const [resetMemberId, setResetMemberId] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetResult, setResetResult] = useState<{ code: string; expiresAt: string; memberName: string } | null>(null);
  const [outreach, setOutreach] = useState<OutreachState | null>(null);
  const [outreachLoading, setOutreachLoading] = useState(true);
  const [outreachBusy, setOutreachBusy] = useState("");
  const [outreachQuery, setOutreachQuery] = useState("");
  const [outreachFilter, setOutreachFilter] = useState<"All" | OutreachStatus>("All");
  const [editingLeadId, setEditingLeadId] = useState("");
  const [outreachForm, setOutreachForm] = useState(emptyOutreachForm);

  async function load() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/saas", { credentials: "include" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error ?? "Could not load SaaS console.");
      setLoading(false);
      return;
    }
    setSnapshot(payload);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
      void loadOutreach();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredWorkspaces = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!snapshot) return [];
    const visibleWorkspaces = workspaceView === "queue"
      ? snapshot.workspaces.filter((workspace) => workspace.accessStatus === "Locked" || workspace.candidateStatus === "Suspended" || workspace.subscription?.status === "Past Due")
      : snapshot.workspaces;

    if (!value) return visibleWorkspaces;
    return visibleWorkspaces.filter((workspace) =>
      [workspace.campaignName, workspace.candidateName, workspace.email, workspace.phoneNumber, workspace.position, workspace.politicalParty]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value)),
    );
  }, [query, snapshot, workspaceView]);

  const pendingPayments = useMemo(() => snapshot?.payments.filter((payment) => payment.status !== "Confirmed") ?? [], [snapshot]);
  const activeResetWorkspaces = useMemo(() => snapshot?.workspaces.filter((workspace) => snapshot.campaignMembers.some((member) => member.candidate_id === workspace.candidateId && member.status === "Active" && member.email)) ?? [], [snapshot]);
  const selectedResetWorkspaceId = resetWorkspaceId || activeResetWorkspaces[0]?.candidateId || "";
  const resetMemberOptions = useMemo(
    () => snapshot?.campaignMembers.filter((member) => member.candidate_id === selectedResetWorkspaceId && member.status === "Active" && member.email) ?? [],
    [selectedResetWorkspaceId, snapshot],
  );
  const selectedResetMemberId = resetMemberId || resetMemberOptions[0]?.id || "";
  const filteredLeads = useMemo(() => {
    const value = outreachQuery.trim().toLowerCase();
    const rows = outreach?.leads ?? [];
    return rows.filter((lead) => {
      const statusMatch = outreachFilter === "All" || lead.status === outreachFilter;
      const queryMatch = !value || [lead.name, lead.seat, lead.contact, lead.phoneNumber, lead.status, lead.outcome, lead.notes]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value));
      return statusMatch && queryMatch;
    });
  }, [outreach, outreachFilter, outreachQuery]);

  async function loadOutreach() {
    setOutreachLoading(true);
    const response = await fetch("/api/admin/outreach", { credentials: "include" });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) {
      setOutreach(payload);
    } else {
      setError(payload.error ?? "Client outreach could not be loaded.");
    }
    setOutreachLoading(false);
  }

  async function runAction(action: string, body: Record<string, string | undefined>) {
    setBusy(`${action}-${body.candidateId ?? body.applicationId ?? body.paymentId ?? body.ticketId}`);
    setStatus("");
    setError("");
    const response = await fetch("/api/admin/saas", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });
    const payload = await response.json().catch(() => ({}));
    setBusy("");
    if (!response.ok) {
      setError(payload.error ?? "Admin action failed.");
      return;
    }
    setSnapshot(payload);
    setStatus(`${action} completed.`);
  }

  async function generateAdminResetCode() {
    if (!selectedResetMemberId) {
      setError("Choose a workspace member first.");
      return;
    }
    setResetBusy(true);
    setResetResult(null);
    setStatus("");
    setError("");
    const response = await fetch("/api/admin/reset-code", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: selectedResetMemberId }),
    });
    const payload = await response.json().catch(() => ({}));
    setResetBusy(false);
    if (!response.ok) {
      setError(payload.error ?? "Reset code could not be generated.");
      return;
    }
    setResetResult({
      code: String(payload.resetCode || ""),
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt).toLocaleString() : "30 minutes",
      memberName: String(payload.member?.fullName || "Campaign member"),
    });
    setStatus("Reset code generated.");
  }

  async function copyResetCode() {
    if (!resetResult?.code) return;
    await navigator.clipboard?.writeText(resetResult.code);
    setStatus("Reset code copied.");
  }

  async function saveOutreachLead() {
    if (!outreachForm.name.trim() || !outreachForm.seat.trim()) {
      setError("Add the candidate name and seat before saving the outreach record.");
      return;
    }
    setOutreachBusy(editingLeadId ? `update-${editingLeadId}` : "create");
    setStatus("");
    setError("");
    const response = await fetch("/api/admin/outreach", {
      method: editingLeadId ? "PATCH" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingLeadId || undefined, ...outreachForm }),
    });
    const payload = await response.json().catch(() => ({}));
    setOutreachBusy("");
    if (!response.ok) {
      setError(payload.error ?? "Outreach record could not be saved.");
      return;
    }
    setOutreach(payload);
    setEditingLeadId("");
    setOutreachForm(emptyOutreachForm);
    setStatus(editingLeadId ? "Client outreach updated." : "Client outreach saved.");
  }

  async function updateOutreachStatus(lead: OutreachLead, nextStatus: OutreachStatus) {
    setOutreachBusy(`${nextStatus}-${lead.id}`);
    setError("");
    setStatus("");
    const response = await fetch("/api/admin/outreach", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lead.id, status: nextStatus }),
    });
    const payload = await response.json().catch(() => ({}));
    setOutreachBusy("");
    if (!response.ok) {
      setError(payload.error ?? "Outreach status could not be updated.");
      return;
    }
    setOutreach(payload);
    setStatus(`Marked ${lead.name} as ${nextStatus}.`);
  }

  async function deleteOutreachLead(lead: OutreachLead) {
    const confirmed = window.confirm(`Delete outreach record for ${lead.name}?`);
    if (!confirmed) return;
    setOutreachBusy(`delete-${lead.id}`);
    setError("");
    setStatus("");
    const response = await fetch(`/api/admin/outreach?id=${encodeURIComponent(lead.id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    const payload = await response.json().catch(() => ({}));
    setOutreachBusy("");
    if (!response.ok) {
      setError(payload.error ?? "Outreach record could not be deleted.");
      return;
    }
    setOutreach(payload);
    setStatus("Client outreach deleted.");
  }

  function editOutreachLead(lead: OutreachLead) {
    setEditingLeadId(lead.id);
    setOutreachForm({
      name: lead.name,
      seat: lead.seat,
      contact: lead.contact ?? "WhatsApp",
      phoneNumber: lead.phoneNumber ?? "",
      status: lead.status,
      demoDate: lead.demoDate ?? "",
      outcome: lead.outcome ?? "",
      nextFollowUp: lead.nextFollowUp ?? "",
      notes: lead.notes ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="j-shell min-h-screen px-4 py-6 text-slate-900 lg:px-6">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link className="text-sm font-bold text-sky-700" href="/">Back to dashboard</Link>
            <h1 className="mt-4 text-3xl font-black text-slate-950">JUKWAA SaaS Admin</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Manage candidate workspaces, payments, subscriptions, support, and early admin approvals from one platform console.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50" href="/admin/activation">
              <ShieldCheck size={16} />
              Quick Approval
            </Link>
            <button className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white shadow-sm hover:bg-slate-900" onClick={() => void load()} type="button">
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {error ? <div className="mt-4 rounded-md bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div> : null}
        {status ? <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{status}</div> : null}

        {loading || !snapshot ? (
          <div className="j-table-shell mt-6 p-6 text-sm font-bold text-slate-600">Loading SaaS console...</div>
        ) : (
          <>
            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Kpi label="Workspaces" value={String(snapshot.summary.workspaces)} icon={Users} />
              <Kpi label="Locked" value={String(snapshot.summary.locked)} icon={AlertTriangle} />
              <Kpi label="Pending Payments" value={String(snapshot.summary.pendingPayments)} icon={CreditCard} />
              <Kpi label="Confirmed Revenue" value={money(snapshot.summary.revenueKes)} icon={WalletCards} />
            </section>

            <section className="j-table-shell mt-6 overflow-hidden">
              <div className="border-b border-slate-200 bg-gradient-to-r from-sky-50 via-white to-amber-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-sky-700">Admin-only sales pipeline</p>
                    <h2 className="mt-1 text-xl font-black text-slate-950">Client Outreach Tracker</h2>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Track candidates you are approaching, demo dates, follow-ups, and outcomes from the platform admin account.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
                      href="/api/admin/outreach?format=csv"
                    >
                      <Download size={16} />
                      Export CSV
                    </a>
                    <button className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-black text-white shadow-sm hover:bg-slate-900" onClick={() => void loadOutreach()} type="button">
                      <RefreshCcw size={16} />
                      Refresh Outreach
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <Kpi label="Prospects" value={String(outreach?.summary.total ?? 0)} icon={Users} />
                  <Kpi label="Contacted" value={String(outreach?.summary.contacted ?? 0)} icon={Phone} />
                  <Kpi label="Demos Booked" value={String(outreach?.summary.demosBooked ?? 0)} icon={CalendarDays} />
                  <Kpi label="Converted" value={String(outreach?.summary.converted ?? 0)} icon={CheckCircle2} />
                  <Kpi label="Follow-ups Due" value={String(outreach?.summary.followUpsDue ?? 0)} icon={AlertTriangle} />
                </div>
              </div>

              <div className="grid gap-4 p-4 xl:grid-cols-[0.82fr_1.18fr]">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="text-base font-black text-slate-950">{editingLeadId ? "Edit Outreach" : "Add Prospect"}</h3>
                  <div className="mt-4 grid gap-3">
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Name
                      <input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm font-semibold normal-case text-slate-900 outline-none focus:border-sky-500" onChange={(event) => setOutreachForm((form) => ({ ...form, name: event.target.value }))} placeholder="Candidate name" value={outreachForm.name} />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                        Seat
                        <select className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm font-semibold normal-case text-slate-900 outline-none focus:border-sky-500" onChange={(event) => setOutreachForm((form) => ({ ...form, seat: event.target.value }))} value={outreachForm.seat}>
                          {["President", "Governor", "Senator", "Woman Rep", "MP", "MCA", "Party Official", "Other"].map((seat) => <option key={seat} value={seat}>{seat}</option>)}
                        </select>
                      </label>
                      <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                        Contact
                        <select className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm font-semibold normal-case text-slate-900 outline-none focus:border-sky-500" onChange={(event) => setOutreachForm((form) => ({ ...form, contact: event.target.value }))} value={outreachForm.contact}>
                          {["WhatsApp", "Call", "SMS", "Email", "Referral", "In-person"].map((contact) => <option key={contact} value={contact}>{contact}</option>)}
                        </select>
                      </label>
                    </div>
                    <input className="h-11 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500" onChange={(event) => setOutreachForm((form) => ({ ...form, phoneNumber: event.target.value }))} placeholder="Phone, email, or contact detail" value={outreachForm.phoneNumber} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                        Status
                        <select className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm font-semibold normal-case text-slate-900 outline-none focus:border-sky-500" onChange={(event) => setOutreachForm((form) => ({ ...form, status: event.target.value as OutreachStatus }))} value={outreachForm.status}>
                          {["New", "Contacted", "Follow-up", "Demo booked", "Demo done", "Converted", "Not interested"].map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </label>
                      <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                        Demo Date
                        <input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm font-semibold normal-case text-slate-900 outline-none focus:border-sky-500" onChange={(event) => setOutreachForm((form) => ({ ...form, demoDate: event.target.value }))} type="date" value={outreachForm.demoDate} />
                      </label>
                    </div>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Next Follow-up
                      <input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm font-semibold normal-case text-slate-900 outline-none focus:border-sky-500" onChange={(event) => setOutreachForm((form) => ({ ...form, nextFollowUp: event.target.value }))} type="date" value={outreachForm.nextFollowUp} />
                    </label>
                    <input className="h-11 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500" onChange={(event) => setOutreachForm((form) => ({ ...form, outcome: event.target.value }))} placeholder="Outcome, e.g. Demo booked" value={outreachForm.outcome} />
                    <textarea className="min-h-24 rounded-md border border-slate-200 p-3 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500" onChange={(event) => setOutreachForm((form) => ({ ...form, notes: event.target.value }))} placeholder="Follow-up notes" value={outreachForm.notes} />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-black text-white shadow-sm hover:bg-slate-900 disabled:opacity-60" disabled={Boolean(outreachBusy)} onClick={() => void saveOutreachLead()} type="button">
                        {editingLeadId ? <Save size={16} /> : <Plus size={16} />}
                        {outreachBusy === "create" ? "Saving..." : editingLeadId ? "Update Lead" : "Add Lead"}
                      </button>
                      <button className="h-11 rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50" onClick={() => { setEditingLeadId(""); setOutreachForm(emptyOutreachForm); }} type="button">
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
                    <div>
                      <h3 className="text-base font-black text-slate-950">Follow-up Board</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{outreach?.storage === "support_tickets" ? "Using safe fallback storage until the outreach table migration is applied." : "Stored in the platform outreach table."}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <select className="h-10 rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none focus:border-sky-500" onChange={(event) => setOutreachFilter(event.target.value as "All" | OutreachStatus)} value={outreachFilter}>
                        {["All", "New", "Contacted", "Follow-up", "Demo booked", "Demo done", "Converted", "Not interested"].map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                      <input className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500 sm:w-64" onChange={(event) => setOutreachQuery(event.target.value)} placeholder="Search prospects" value={outreachQuery} />
                    </div>
                  </div>
                  <div className="max-h-[560px] overflow-y-auto p-4">
                    {outreachLoading ? <p className="rounded-md bg-slate-50 p-3 text-sm font-bold text-slate-500">Loading outreach...</p> : null}
                    <div className="grid gap-3">
                      {filteredLeads.map((lead) => (
                        <article key={lead.id} className="rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3 shadow-sm">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-slate-950">{lead.name}</p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">{lead.seat} - {lead.contact || "Contact not set"} {lead.phoneNumber ? `- ${lead.phoneNumber}` : ""}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${outreachStatusClass(lead.status)}`}>{lead.status}</span>
                          </div>
                          <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-3">
                            <span>Demo: {dateText(lead.demoDate)}</span>
                            <span>Follow-up: {dateText(lead.nextFollowUp)}</span>
                            <span>Updated: {dateText(lead.updatedAt)}</span>
                          </div>
                          {lead.outcome ? <p className="mt-2 text-sm font-bold text-slate-800">{lead.outcome}</p> : null}
                          {lead.notes ? <p className="mt-1 text-sm leading-6 text-slate-600">{lead.notes}</p> : null}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(["Contacted", "Demo booked", "Follow-up", "Converted"] as OutreachStatus[]).map((nextStatus) => (
                              <button key={nextStatus} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60" disabled={Boolean(outreachBusy)} onClick={() => void updateOutreachStatus(lead, nextStatus)} type="button">
                                {nextStatus}
                              </button>
                            ))}
                            <button className="inline-flex h-8 items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 text-xs font-black text-sky-800 hover:bg-sky-100" onClick={() => editOutreachLead(lead)} type="button">
                              <Edit3 size={13} />
                              Edit
                            </button>
                            <button className="inline-flex h-8 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 text-xs font-black text-red-700 hover:bg-red-100" onClick={() => void deleteOutreachLead(lead)} type="button">
                              <Trash2 size={13} />
                              Delete
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                    {!outreachLoading && !filteredLeads.length ? <p className="rounded-md bg-slate-50 p-3 text-sm font-bold text-slate-500">No outreach records yet. Add the first potential client on the left.</p> : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="j-table-shell mt-6 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                    <KeyRound size={19} />
                  </span>
                  <div>
                    <h2 className="text-base font-black text-slate-950">Password Reset Center</h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Generate a 30-minute reset code for any active candidate or campaign team member from the platform admin console.</p>
                  </div>
                </div>
                {resetResult ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Reset code for {resetResult.memberName}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <code className="rounded-md bg-slate-950 px-3 py-2 font-mono text-sm font-black text-white">{resetResult.code}</code>
                      <button className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50" onClick={() => void copyResetCode()} type="button">
                        <Copy size={14} />
                        Copy
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Expires {resetResult.expiresAt}.</p>
                  </div>
                ) : null}
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Workspace
                  <select
                    className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-800 outline-none focus:border-sky-500"
                    disabled={!activeResetWorkspaces.length || resetBusy}
                    onChange={(event) => {
                      setResetWorkspaceId(event.target.value);
                      setResetMemberId("");
                      setResetResult(null);
                    }}
                    value={selectedResetWorkspaceId}
                  >
                    {activeResetWorkspaces.map((workspace) => (
                      <option key={workspace.candidateId} value={workspace.candidateId}>{workspace.candidateName} - {workspace.campaignName}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Member
                  <select
                    className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-800 outline-none focus:border-sky-500"
                    disabled={!resetMemberOptions.length || resetBusy}
                    onChange={(event) => {
                      setResetMemberId(event.target.value);
                      setResetResult(null);
                    }}
                    value={selectedResetMemberId}
                  >
                    {resetMemberOptions.map((member) => (
                      <option key={member.id} value={member.id}>{member.full_name || member.email} - {member.role || "Member"}</option>
                    ))}
                  </select>
                </label>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-md bg-slate-950 px-4 text-sm font-black text-white shadow-sm hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!selectedResetMemberId || resetBusy}
                  onClick={() => void generateAdminResetCode()}
                  type="button"
                >
                  <KeyRound size={16} />
                  {resetBusy ? "Generating..." : "Generate Reset Code"}
                </button>
              </div>
              {!activeResetWorkspaces.length ? <p className="mt-3 text-sm font-bold text-amber-700">No active campaign members with login details are available yet.</p> : null}
            </section>

            <section className="j-table-shell mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
                <div>
                  <h2 className="text-base font-black text-slate-950">{workspaceView === "queue" ? "Needs Action Queue" : "Workspace Operations"}</h2>
                  <p className="mt-1 text-sm text-slate-500">Approve before payment, confirm payment, suspend, reactivate, and manage subscription health.</p>
                </div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  <div className="grid h-10 grid-cols-2 rounded-md border border-slate-200 bg-slate-50 p-1">
                    <button
                      className={`rounded px-3 text-xs font-black ${workspaceView === "queue" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
                      onClick={() => setWorkspaceView("queue")}
                      type="button"
                    >
                      Needs Action
                    </button>
                    <button
                      className={`rounded px-3 text-xs font-black ${workspaceView === "all" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
                      onClick={() => setWorkspaceView("all")}
                      type="button"
                    >
                      All Workspaces
                    </button>
                  </div>
                  <input
                    className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500 sm:w-80"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search workspace, candidate, phone"
                    value={query}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Workspace</th>
                      <th className="px-4 py-3">Access</th>
                      <th className="px-4 py-3">Application</th>
                      <th className="px-4 py-3">Subscription</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Support</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredWorkspaces.map((workspace) => (
                      <tr key={workspace.candidateId} className="align-top transition hover:bg-slate-50">
                        <td className="px-4 py-4">
                          <p className="font-black text-slate-950">{workspace.campaignName}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{workspace.candidateName} - {workspace.position}</p>
                          <p className="mt-1 text-xs text-slate-500">{workspace.email ?? workspace.phoneNumber}</p>
                        </td>
                        <td className="px-4 py-4">
                          <Status value={workspace.accessStatus} />
                          <p className="mt-2 text-xs text-slate-500">{workspace.candidateStatus} / {workspace.verificationStatus}</p>
                        </td>
                        <td className="px-4 py-4">
                          <Status value={workspace.application?.status ?? "Missing"} />
                          <p className="mt-2 text-xs text-slate-500">{workspace.application?.payment_reference ?? "No reference"}</p>
                        </td>
                        <td className="px-4 py-4">
                          <Status value={workspace.subscription?.status ?? "Missing"} />
                          <p className="mt-2 text-xs text-slate-500">{workspace.subscription?.plan ?? "No plan"} - exp {dateText(workspace.subscription?.expiry_date)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <Status value={workspace.latestPayment?.status ?? "No Payment"} />
                          <p className="mt-2 text-xs text-slate-500">{workspace.latestPayment ? money(Number(workspace.latestPayment.amount_kes)) : "Awaiting payment"}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-black text-slate-950">{workspace.openTickets}</span>
                          <p className="mt-1 text-xs text-slate-500">open tickets</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="grid gap-2">
                            <button
                              className="h-9 rounded-md bg-slate-950 px-3 text-xs font-black text-white hover:bg-slate-900 disabled:bg-slate-300"
                              disabled={Boolean(busy)}
                              onClick={() => void runAction("Approve Workspace", { applicationId: workspace.application?.id, tenantId: workspace.tenantId, candidateId: workspace.candidateId })}
                              type="button"
                            >
                              Approve Access
                            </button>
                            <button
                              className="h-9 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-700 hover:bg-emerald-100 disabled:bg-slate-100"
                              disabled={!workspace.pendingPayment || Boolean(busy)}
                              onClick={() => void runAction("Confirm Payment", { applicationId: workspace.application?.id, paymentId: workspace.pendingPayment?.id, tenantId: workspace.tenantId, candidateId: workspace.candidateId })}
                              type="button"
                            >
                              Confirm Payment
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                className="h-9 rounded-md border border-amber-200 bg-amber-50 px-2 text-xs font-black text-amber-800 hover:bg-amber-100 disabled:bg-slate-100"
                                disabled={Boolean(busy)}
                                onClick={() => void runAction("Mark Past Due", { tenantId: workspace.tenantId, candidateId: workspace.candidateId })}
                                type="button"
                              >
                                Past Due
                              </button>
                              <button
                                className="h-9 rounded-md border border-red-200 bg-red-50 px-2 text-xs font-black text-red-700 hover:bg-red-100 disabled:bg-slate-100"
                                disabled={Boolean(busy)}
                                onClick={() => void runAction("Suspend Workspace", { tenantId: workspace.tenantId, candidateId: workspace.candidateId })}
                                type="button"
                              >
                                Suspend
                              </button>
                            </div>
                            <button
                              className="h-9 rounded-md border border-sky-200 bg-sky-50 px-3 text-xs font-black text-sky-800 hover:bg-sky-100 disabled:bg-slate-100"
                              disabled={Boolean(busy)}
                              onClick={() => void runAction("Reactivate Workspace", { tenantId: workspace.tenantId, candidateId: workspace.candidateId })}
                              type="button"
                            >
                              Reactivate
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredWorkspaces.length ? (
                  <div className="border-t border-slate-100 p-6 text-sm font-bold text-slate-500">
                    {workspaceView === "queue" ? "No workspaces need approval right now." : "No workspaces match your search."}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="j-panel p-4">
                <h2 className="text-base font-black text-slate-950">Payment Queue</h2>
                <div className="mt-4 grid gap-3">
                  {pendingPayments.slice(0, 8).map((payment) => (
                    <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 p-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">{payment.account_reference}</p>
                        <p className="mt-1 text-xs text-slate-500">{payment.channel} - {money(Number(payment.amount_kes))} - {dateText(payment.submitted_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Status value={payment.status} />
                        <button
                          className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 text-xs font-black text-emerald-700 hover:bg-emerald-50 disabled:bg-slate-100"
                          disabled={payment.status === "Confirmed" || Boolean(busy)}
                          onClick={() => void runAction("Confirm Payment", { paymentId: payment.id, applicationId: payment.onboarding_application_id ?? undefined, tenantId: payment.tenant_id ?? undefined, candidateId: payment.candidate_id ?? undefined })}
                          type="button"
                        >
                          <CheckCircle2 size={14} />
                          Confirm
                        </button>
                      </div>
                    </div>
                  ))}
                  {!pendingPayments.length ? <p className="rounded-md bg-slate-50 p-3 text-sm font-bold text-slate-500">No pending payments need confirmation.</p> : null}
                </div>
              </div>

              <div className="j-panel p-4">
                <h2 className="text-base font-black text-slate-950">Platform Admins</h2>
                <div className="mt-4 grid gap-3">
                  {snapshot.platformAdmins.map((admin) => (
                    <div key={admin.id} className="rounded-md bg-slate-50 p-3">
                      <p className="text-sm font-black text-slate-950">{admin.full_name}</p>
                      <p className="mt-1 text-xs text-slate-500">{admin.email}</p>
                      <div className="mt-2"><Status value={admin.status} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="j-panel mt-6 p-4">
              <h2 className="text-base font-black text-slate-950">Support Tickets</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {snapshot.tickets.slice(0, 12).map((ticket) => (
                  <div key={ticket.id} className="rounded-md border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">{ticket.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{ticket.priority} - {dateText(ticket.created_at)}</p>
                      </div>
                      <Status value={ticket.status} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{ticket.description ?? "No description"}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-700 disabled:bg-slate-100"
                        disabled={["Resolved", "Closed"].includes(ticket.status) || Boolean(busy)}
                        onClick={() => void runAction("Resolve Ticket", { ticketId: ticket.id, tenantId: ticket.tenant_id ?? undefined, candidateId: ticket.candidate_id ?? undefined })}
                        type="button"
                      >
                        <CheckCircle2 size={14} />
                        Resolve
                      </button>
                      <button
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 disabled:bg-slate-100"
                        disabled={ticket.status === "Closed" || Boolean(busy)}
                        onClick={() => void runAction("Close Ticket", { ticketId: ticket.id, tenantId: ticket.tenant_id ?? undefined, candidateId: ticket.candidate_id ?? undefined })}
                        type="button"
                      >
                        <XCircle size={14} />
                        Close
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
