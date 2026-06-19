"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CreditCard, RefreshCcw, ShieldCheck, Users, WalletCards, XCircle } from "lucide-react";

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

function Kpi({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Users }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-sky-50 text-sky-700">
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
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

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
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredWorkspaces = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!snapshot) return [];
    if (!value) return snapshot.workspaces;
    return snapshot.workspaces.filter((workspace) =>
      [workspace.campaignName, workspace.candidateName, workspace.email, workspace.phoneNumber, workspace.position, workspace.politicalParty]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value)),
    );
  }, [query, snapshot]);

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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 lg:px-6">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link className="text-sm font-bold text-sky-700" href="/">Back to dashboard</Link>
            <h1 className="mt-4 text-3xl font-black text-slate-950">JUKWAA SaaS Admin</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Manage candidate workspaces, payments, subscriptions, support, and early admin approvals from one platform console.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50" href="/admin/activation">
              <ShieldCheck size={16} />
              Quick Approval
            </Link>
            <button className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white hover:bg-slate-900" onClick={() => void load()} type="button">
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {error ? <div className="mt-4 rounded-md bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div> : null}
        {status ? <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{status}</div> : null}

        {loading || !snapshot ? (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 text-sm font-bold text-slate-600 shadow-sm">Loading SaaS console...</div>
        ) : (
          <>
            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Kpi label="Workspaces" value={String(snapshot.summary.workspaces)} icon={Users} />
              <Kpi label="Locked" value={String(snapshot.summary.locked)} icon={AlertTriangle} />
              <Kpi label="Pending Payments" value={String(snapshot.summary.pendingPayments)} icon={CreditCard} />
              <Kpi label="Confirmed Revenue" value={money(snapshot.summary.revenueKes)} icon={WalletCards} />
            </section>

            <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
                <div>
                  <h2 className="text-base font-black text-slate-950">Workspace Operations</h2>
                  <p className="mt-1 text-sm text-slate-500">Approve before payment, confirm payment, suspend, reactivate, and manage subscription health.</p>
                </div>
                <input
                  className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500 sm:w-80"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search workspace, candidate, phone"
                  value={query}
                />
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
                      <tr key={workspace.candidateId} className="align-top hover:bg-slate-50">
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
              </div>
            </section>

            <section className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-black text-slate-950">Payment Queue</h2>
                <div className="mt-4 grid gap-3">
                  {snapshot.payments.slice(0, 8).map((payment) => (
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
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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

            <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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
