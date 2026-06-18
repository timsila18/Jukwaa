import { NextResponse } from "next/server";
import { z } from "zod";
import { getLooseSupabaseAdmin, getSupabaseAdmin } from "@/lib/supabase";
import { shortCode, slugify, writeAudit } from "@/lib/server-workflows";
import { enforceRateLimit, requestKey } from "@/lib/rate-limit";
import { loginEmail } from "@/lib/auth-session";

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

export async function POST(request: Request) {
  const limited = await enforceRateLimit(requestKey(request, "candidate-onboarding"), 8, 60_000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many candidate registration attempts. Try again shortly." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Candidate registration details are incomplete." }, { status: 400 });
  }

  const supabase = getLooseSupabaseAdmin();
  const authAdmin = getSupabaseAdmin();
  const data = parsed.data;
  const slug = slugify(data.campaignName || data.fullName);
  const authEmail = data.email ? data.email.toLowerCase() : loginEmail(data.phoneNumber);
  const accountReference = `JUKWAA-${shortCode(slug.toUpperCase().slice(0, 10) || "CAND")}`;
  const amountDue = planPricing[data.plan];

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({ name: data.campaignName, slug, is_demo: false })
    .select("id")
    .single();

  if (tenantError || !tenant) {
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
      county: data.county || null,
      constituency: data.constituency || null,
      ward: data.ward || null,
      campaign_name: data.campaignName,
      slogan: data.slogan || null,
      active_status: "Draft",
      verification_status: "Pending",
    })
    .select("id")
    .single();

  if (candidateError || !candidate) {
    return NextResponse.json({ error: "Could not create candidate record.", detail: candidateError?.message }, { status: 500 });
  }

  await supabase.from("campaign_settings").insert({
    tenant_id: tenant.id,
    candidate_id: candidate.id,
    campaign_name: data.campaignName,
    candidate_name: data.fullName,
    position_targeted: data.position,
    political_party: data.politicalParty,
    county: data.county || null,
    constituency: data.constituency || null,
    slogan: data.slogan || null,
    election_year: 2027,
    active_status: "Draft",
  });

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
    return NextResponse.json({ error: "Workspace records were created, but candidate login could not be created. Contact support.", detail: userError?.message }, { status: 409 });
  }

  const { data: member } = await supabase.from("campaign_members").insert({
    tenant_id: tenant.id,
    candidate_id: candidate.id,
    user_id: createdUser.user.id,
    email: authEmail,
    full_name: data.fullName,
    role: "Candidate",
    status: "Active",
  }).select("id").single();

  const { data: subscription } = await supabase.from("workspace_subscriptions").insert({
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

  const invoiceNumber = `JUK-${new Date().getFullYear()}-${shortCode("INV")}`;
  await supabase.from("invoices").insert({
    tenant_id: tenant.id,
    candidate_id: candidate.id,
    subscription_id: subscription?.id,
    invoice_number: invoiceNumber,
    amount_kes: amountDue,
    status: "Issued",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  const { data: application } = await supabase.from("candidate_onboarding_applications").insert({
    full_name: data.fullName,
    phone_number: data.phoneNumber,
    email: data.email || null,
    national_id: data.nationalId || null,
    position_contesting: data.position,
    political_party: data.politicalParty,
    county: data.county || null,
    constituency: data.constituency || null,
    ward: data.ward || null,
    campaign_name: data.campaignName,
    slogan: data.slogan || null,
    plan: data.plan,
    amount_due_kes: amountDue,
    tenant_id: tenant.id,
    candidate_id: candidate.id,
    payment_reference: accountReference,
  }).select("id").single();

  await writeAudit({
    tenantId: tenant.id,
    candidateId: candidate.id,
    action: "Create",
    module: "Candidate Onboarding",
    recordId: application?.id,
    newValue: { campaignName: data.campaignName, plan: data.plan, accountReference, memberId: member?.id },
  });

  return NextResponse.json({
    applicationId: application?.id,
    tenantId: tenant.id,
    candidateId: candidate.id,
    status: "Payment Pending",
    amountDueKes: amountDue,
    accountReference,
    paybillNumber: process.env.MPESA_PAYBILL_NUMBER || "CONFIGURE_PAYBILL",
  });
}
