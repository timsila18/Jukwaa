import { NextResponse } from "next/server";
import { z } from "zod";
import { getLooseSupabaseAdmin, getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(12),
  fullName: z.string().trim().min(2).default("JUKWAA Super Admin"),
});

type AuthUser = {
  id: string;
  email?: string;
};

function bootstrapSecret(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  return request.headers.get("x-jukwaa-bootstrap-secret") || bearer;
}

function assertBootstrapSecret(request: Request) {
  const expected = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!expected || expected.length < 24) {
    return NextResponse.json({ error: "Admin bootstrap is not configured." }, { status: 503 });
  }
  if (bootstrapSecret(request) !== expected) {
    return NextResponse.json({ error: "Admin bootstrap secret is invalid." }, { status: 403 });
  }
  return null;
}

async function findAuthUser(email: string): Promise<AuthUser | null> {
  const authAdmin = getSupabaseAdmin();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await authAdmin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error(error.message);
    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return { id: user.id, email: user.email ?? email };
    if (data.users.length < 100) break;
  }
  return null;
}

async function ensureAuthUser(input: z.infer<typeof schema>) {
  const authAdmin = getSupabaseAdmin();
  const existing = await findAuthUser(input.email);
  if (existing) {
    const { error } = await authAdmin.auth.admin.updateUserById(existing.id, {
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName },
      app_metadata: { platform_admin: true, role: "Platform Admin" },
    });
    if (error) throw new Error(error.message);
    return existing;
  }

  const { data, error } = await authAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
    app_metadata: { platform_admin: true, role: "Platform Admin" },
  });
  if (error || !data.user) throw new Error(error?.message ?? "Could not create admin auth user.");
  return { id: data.user.id, email: data.user.email ?? input.email };
}

async function ensureAdminWorkspace(input: z.infer<typeof schema>, userId: string) {
  const admin = getLooseSupabaseAdmin();
  const workspaceSlug = "jukwaa-platform-admin";
  const { data: existingTenant } = await admin.from("tenants").select("id").eq("slug", workspaceSlug).maybeSingle();

  const tenant = existingTenant ?? (await admin
    .from("tenants")
    .insert({ name: "JUKWAA Platform Admin", slug: workspaceSlug, is_demo: false })
    .select("id")
    .single()).data;

  if (!tenant?.id) throw new Error("Could not create platform admin tenant.");

  const { data: existingCandidate } = await admin.from("candidates").select("id").eq("tenant_id", tenant.id).maybeSingle();
  const candidate = existingCandidate ?? (await admin
    .from("candidates")
    .insert({
      tenant_id: tenant.id,
      full_name: "JUKWAA Platform",
      phone_number: "+254700000000",
      email: input.email,
      political_party: "Independent Candidate",
      position_contesting: "Presidential",
      campaign_name: "JUKWAA Platform Admin",
      slogan: "Where Leadership Meets the People",
      active_status: "Active",
      verification_status: "Verified",
    })
    .select("id")
    .single()).data;

  if (!candidate?.id) throw new Error("Could not create platform admin candidate record.");

  const settingsPayload = {
    tenant_id: tenant.id,
    candidate_id: candidate.id,
    campaign_name: "JUKWAA Platform Admin",
    candidate_name: "JUKWAA Platform",
    position_targeted: "Presidential",
    political_party: "Independent Candidate",
    election_year: 2027,
    slogan: "Where Leadership Meets the People",
    active_status: "Active",
  };
  const { data: existingSettings } = await admin.from("campaign_settings").select("id").eq("tenant_id", tenant.id).limit(1).maybeSingle();
  if (existingSettings?.id) {
    await admin.from("campaign_settings").update(settingsPayload).eq("id", existingSettings.id);
  } else {
    await admin.from("campaign_settings").insert(settingsPayload);
  }

  await admin.from("campaign_members").upsert({
    tenant_id: tenant.id,
    candidate_id: candidate.id,
    user_id: userId,
    email: input.email.toLowerCase(),
    full_name: input.fullName,
    role: "Admin",
    status: "Active",
  }, { onConflict: "tenant_id,email" });

  await admin.from("platform_admins").upsert({
    user_id: userId,
    email: input.email.toLowerCase(),
    full_name: input.fullName,
    status: "Active",
  }, { onConflict: "email" });

  return { tenantId: tenant.id, candidateId: candidate.id };
}

export async function POST(request: Request) {
  const secretFailure = assertBootstrapSecret(request);
  if (secretFailure) return secretFailure;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({
      error: "Admin email, full name, and a 12+ character password are required.",
      fields: parsed.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
    }, { status: 400 });
  }

  try {
    const input = { ...parsed.data, email: parsed.data.email.toLowerCase(), fullName: parsed.data.fullName.trim() };
    const authUser = await ensureAuthUser(input);
    const workspace = await ensureAdminWorkspace(input, authUser.id);
    return NextResponse.json({
      status: "Superadmin ready",
      email: input.email,
      loginUrl: "/login",
      saasUrl: "/admin/saas",
      tenantId: workspace.tenantId,
      candidateId: workspace.candidateId,
    });
  } catch (error) {
    return NextResponse.json({
      error: "Could not bootstrap superadmin.",
      detail: error instanceof Error ? error.message : "Unknown bootstrap failure.",
    }, { status: 503 });
  }
}
