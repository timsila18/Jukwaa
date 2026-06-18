import { getLooseSupabaseAdmin } from "@/lib/supabase";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function shortCode(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function getDefaultWorkspace() {
  const supabase = getLooseSupabaseAdmin();
  const { data: candidate, error } = await supabase
    .from("candidates")
    .select("id, tenant_id")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !candidate) {
    throw new Error("No candidate workspace is available.");
  }

  return { tenantId: candidate.tenant_id as string, candidateId: candidate.id as string };
}

export async function writeAudit(input: {
  tenantId: string;
  candidateId?: string | null;
  action: string;
  module: string;
  recordId?: string | null;
  newValue?: unknown;
}) {
  const supabase = getLooseSupabaseAdmin();
  await supabase.from("workspace_audit_logs").insert({
    tenant_id: input.tenantId,
    candidate_id: input.candidateId,
    action: input.action,
    module: input.module,
    record_id: input.recordId,
    new_value: input.newValue ?? {},
  });
}
