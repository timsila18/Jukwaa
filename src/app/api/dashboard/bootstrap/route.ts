import { NextResponse } from "next/server";
import { getLooseSupabaseAdmin } from "@/lib/supabase";
import { getWorkspaceAccess, requireSession } from "@/lib/auth-session";

async function countRows(table: string, tenantId: string) {
  const admin = getLooseSupabaseAdmin();
  const { data } = await admin.from(table).select("id").eq("tenant_id", tenantId);
  return Array.isArray(data) ? data.length : 0;
}

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;
  const workspaceAccess = await getWorkspaceAccess(auth.session);

  const admin = getLooseSupabaseAdmin();
  const [supporters, volunteers, issues, events, payments, invitations] = await Promise.all([
    countRows("supporters", auth.session.tenantId),
    countRows("volunteers", auth.session.tenantId),
    countRows("community_issues", auth.session.tenantId),
    countRows("campaign_events", auth.session.tenantId),
    countRows("workspace_activation_payments", auth.session.tenantId),
    countRows("invitations", auth.session.tenantId),
  ]);

  const { data: settings } = await admin
    .from("campaign_settings")
    .select("campaign_name, candidate_name, position_targeted, political_party, county, constituency, election_year, slogan, active_status")
    .eq("tenant_id", auth.session.tenantId)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    workspace: {
      tenantId: auth.session.tenantId,
      candidateId: auth.session.candidateId,
      memberId: auth.session.memberId,
      role: auth.session.role,
      isPlatformAdmin: auth.session.isPlatformAdmin,
      access: workspaceAccess,
    },
    campaign: settings,
    summary: {
      supporters,
      volunteers,
      issues,
      events,
      payments,
      invitations,
    },
  });
}
