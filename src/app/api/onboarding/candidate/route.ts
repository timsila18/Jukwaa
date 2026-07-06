import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getLooseSupabaseAdmin, getSupabaseAdmin } from "@/lib/supabase";
import { shortCode, slugify, writeAudit } from "@/lib/server-workflows";
import { enforceRateLimit, requestKey } from "@/lib/rate-limit";
import { attachSessionCookies, loginEmail } from "@/lib/auth-session";

const schema = z.object({
  fullName: z.string().trim().min(2),
  phoneNumber: z.string().trim().min(7),
  email: z.string().trim().email().optional().or(z.literal("")),
  nationalId: z.string().trim().optional().or(z.literal("")),
  position: z.enum(["Presidential", "Governor", "Senator", "Women Representative", "MP", "MCA", "Party Election", "Referendum"]),
  politicalParty: z.string().trim().min(2),
  county: z.string().trim().optional().or(z.literal("")),
  constituency: z.string().trim().optional().or(z.literal("")),
  ward: z.string().trim().optional().or(z.literal("")),
  campaignName: z.string().trim().min(2),
  slogan: z.string().trim().optional().or(z.literal("")),
  plan: z.enum(["Starter", "Professional", "Advanced", "Enterprise"]).default("Professional"),
  password: z.string().min(8),
});

const planPricing: Record<string, number> = {
  Starter: 15000,
  Professional: 45000,
  Advanced: 85000,
  Enterprise: 150000,
};

const positionGeography: Record<string, { county: boolean; constituency: boolean; ward: boolean }> = {
  Presidential: { county: false, constituency: false, ward: false },
  Governor: { county: true, constituency: false, ward: false },
  Senator: { county: true, constituency: false, ward: false },
  "Women Representative": { county: true, constituency: false, ward: false },
  MP: { county: true, constituency: true, ward: false },
  MCA: { county: true, constituency: true, ward: true },
  "Party Election": { county: true, constituency: true, ward: true },
  Referendum: { county: false, constituency: false, ward: false },
};

async function cleanupFailedWorkspace(tenantId?: string, userId?: string) {
  const admin = getLooseSupabaseAdmin();
  const authAdmin = getSupabaseAdmin();
  await Promise.allSettled([
    tenantId ? admin.from("tenants").delete().eq("id", tenantId) : Promise.resolve(),
    userId ? authAdmin.auth.admin.deleteUser(userId) : Promise.resolve(),
  ]);
}

function isConnectionFailure(error?: { message?: string } | null) {
  return Boolean(error?.message?.toLowerCase().includes("fetch failed"));
}

function databaseUnavailable(detail?: string) {
  return NextResponse.json(
    {
      error: "JUKWAA database connection is unavailable. Please contact support to verify the production database configuration.",
      detail,
    },
    { status: 503 },
  );
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(requestKey(request, "candidate-onboarding"), 8, 60_000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many candidate registration attempts. Try again shortly." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({
      error: "Candidate registration details are incomplete.",
      fields: parsed.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
    }, { status: 400 });
  }

  const supabase = getLooseSupabaseAdmin();
  const authAdmin = getSupabaseAdmin();
  const data = parsed.data;
  const geography = positionGeography[data.position];
  const county = geography.county ? data.county?.trim() ?? "" : "";
  const constituency = geography.constituency ? data.constituency?.trim() ?? "" : "";
  const ward = geography.ward ? data.ward?.trim() ?? "" : "";

  if (geography.county && !county) {
    return NextResponse.json({ error: "County is required for this position." }, { status: 400 });
  }

  if (geography.constituency && !constituency) {
    return NextResponse.json({ error: "Constituency is required for this position." }, { status: 400 });
  }

  if (geography.ward && !ward) {
    return NextResponse.json({ error: "Ward is required for this position." }, { status: 400 });
  }

  const baseSlug = slugify(data.campaignName || data.fullName) || "candidate-workspace";
  const slug = slugify(`${baseSlug}-${shortCode("ws")}`);
  const authEmail = data.email ? data.email.toLowerCase() : loginEmail(data.phoneNumber);
  const accountReference = `JUKWAA-${shortCode(slug.toUpperCase().slice(0, 10) || "CAND")}`;
  const amountDue = planPricing[data.plan];

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({ name: data.campaignName, slug, is_demo: false })
    .select("id")
    .single();

  if (tenantError || !tenant) {
    if (isConnectionFailure(tenantError)) return databaseUnavailable(tenantError?.message);
    return NextResponse.json({ error: "Could not create candidate workspace tenant.", detail: tenantError?.message }, { status: 409 });
  }

  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .insert({
      tenant_id: tenant.id,
      full_name: data.fullName,
      phone_number: data.phoneNumber,
      email: data.email || null,
      national_id: data.nationalId || null,
      political_party: data.politicalParty,
      position_contesting: data.position,
      county: county || null,
      constituency: constituency || null,
      ward: ward || null,
      campaign_name: data.campaignName,
      slogan: data.slogan || null,
      active_status: "Draft",
      verification_status: "Pending",
    })
    .select("id")
    .single();

  if (candidateError || !candidate) {
    await cleanupFailedWorkspace(tenant.id);
    if (isConnectionFailure(candidateError)) return databaseUnavailable(candidateError?.message);
    return NextResponse.json({ error: "Could not create candidate record.", detail: candidateError?.message }, { status: 500 });
  }

  const { error: settingsError } = await supabase.from("campaign_settings").insert({
    tenant_id: tenant.id,
    candidate_id: candidate.id,
    campaign_name: data.campaignName,
    candidate_name: data.fullName,
    position_targeted: data.position,
    political_party: data.politicalParty,
    county: county || null,
    constituency: constituency || null,
    slogan: data.slogan || null,
    election_year: 2027,
    active_status: "Draft",
  });

  if (settingsError) {
    await cleanupFailedWorkspace(tenant.id);
    if (isConnectionFailure(settingsError)) return databaseUnavailable(settingsError.message);
    return NextResponse.json({ error: "Could not create campaign settings.", detail: settingsError.message }, { status: 500 });
  }

  const { data: createdUser, error: userError } = await authAdmin.auth.admin.createUser({
    email: authEmail,
    password: data.password,
    email_confirm: true,
    phone_confirm: true,
    user_metadata: {
      full_name: data.fullName,
      phone_number: data.phoneNumber,
    },
    app_metadata: {
      tenant_id: tenant.id,
      candidate_id: candidate.id,
      role: "Candidate",
    },
  });

  if (userError || !createdUser.user) {
    await cleanupFailedWorkspace(tenant.id);
    if (isConnectionFailure(userError)) return databaseUnavailable(userError?.message);
    return NextResponse.json({ error: "Workspace records were created, but candidate login could not be created. Contact support.", detail: userError?.message }, { status: 409 });
  }

  const { data: member, error: memberError } = await supabase.from("campaign_members").insert({
    tenant_id: tenant.id,
    candidate_id: candidate.id,
    user_id: createdUser.user.id,
    email: authEmail,
    full_name: data.fullName,
    role: "Candidate",
    status: "Active",
  }).select("id").single();

  if (memberError || !member) {
    await cleanupFailedWorkspace(tenant.id, createdUser.user.id);
    if (isConnectionFailure(memberError)) return databaseUnavailable(memberError?.message);
    return NextResponse.json({ error: "Candidate login was created, but workspace membership failed. Please try again.", detail: memberError?.message }, { status: 500 });
  }

  const { data: subscription, error: subscriptionError } = await supabase.from("workspace_subscriptions").insert({
    tenant_id: tenant.id,
    candidate_id: candidate.id,
    plan: data.plan,
    start_date: new Date().toISOString().slice(0, 10),
    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: "Trial",
    user_limit: data.plan === "Starter" ? 10 : data.plan === "Professional" ? 50 : 200,
    volunteer_limit: data.plan === "Starter" ? 100 : data.plan === "Professional" ? 500 : 2000,
    polling_agent_limit: data.plan === "Starter" ? 50 : data.plan === "Professional" ? 300 : 1000,
    storage_limit_gb: data.plan === "Starter" ? 10 : data.plan === "Professional" ? 100 : 500,
  }).select("id").single();

  if (subscriptionError || !subscription) {
    await cleanupFailedWorkspace(tenant.id, createdUser.user.id);
    if (isConnectionFailure(subscriptionError)) return databaseUnavailable(subscriptionError?.message);
    return NextResponse.json({ error: "Could not create workspace subscription.", detail: subscriptionError?.message }, { status: 500 });
  }

  const invoiceNumber = `JUK-${new Date().getFullYear()}-${shortCode("INV")}`;
  const { error: invoiceError } = await supabase.from("invoices").insert({
    tenant_id: tenant.id,
    candidate_id: candidate.id,
    subscription_id: subscription.id,
    invoice_number: invoiceNumber,
    amount_kes: amountDue,
    status: "Issued",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  if (invoiceError) {
    await cleanupFailedWorkspace(tenant.id, createdUser.user.id);
    if (isConnectionFailure(invoiceError)) return databaseUnavailable(invoiceError.message);
    return NextResponse.json({ error: "Could not create activation invoice.", detail: invoiceError.message }, { status: 500 });
  }

  const { data: application, error: applicationError } = await supabase.from("candidate_onboarding_applications").insert({
    full_name: data.fullName,
    phone_number: data.phoneNumber,
    email: data.email || null,
    national_id: data.nationalId || null,
    position_contesting: data.position,
    political_party: data.politicalParty,
    county: county || null,
    constituency: constituency || null,
    ward: ward || null,
    campaign_name: data.campaignName,
    slogan: data.slogan || null,
    plan: data.plan,
    amount_due_kes: amountDue,
    tenant_id: tenant.id,
    candidate_id: candidate.id,
    payment_reference: accountReference,
  }).select("id").single();

  if (applicationError || !application) {
    await cleanupFailedWorkspace(tenant.id, createdUser.user.id);
    if (isConnectionFailure(applicationError)) return databaseUnavailable(applicationError?.message);
    return NextResponse.json({ error: "Could not create onboarding application.", detail: applicationError?.message }, { status: 500 });
  }

  await writeAudit({
    tenantId: tenant.id,
    candidateId: candidate.id,
    action: "Create",
    module: "Candidate Onboarding",
    recordId: application.id,
    newValue: { campaignName: data.campaignName, plan: data.plan, accountReference, memberId: member?.id },
  });

  const response = NextResponse.json({
    applicationId: application.id,
    tenantId: tenant.id,
    candidateId: candidate.id,
    status: "Payment Pending",
    amountDueKes: amountDue,
    accountReference,
    paybillNumber: process.env.MPESA_PAYBILL_NUMBER || "CONFIGURE_PAYBILL",
    redirectTo: `/payment/confirm?${new URLSearchParams({
      applicationId: application.id,
      accountReference,
      phoneNumber: data.phoneNumber,
      amountKes: String(amountDue),
    }).toString()}`,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && key) {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const signedIn = await client.auth.signInWithPassword({ email: authEmail, password: data.password }).catch(() => null);
    if (signedIn?.data.session) attachSessionCookies(response, signedIn.data.session);
  }

  return response;
}
