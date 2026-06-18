import { NextResponse } from "next/server";
import { z } from "zod";
import { getLooseSupabaseAdmin } from "@/lib/supabase";
import { requireSession } from "@/lib/auth-session";
import { writeAudit } from "@/lib/server-workflows";

const schema = z.object({
  fileName: z.string().trim().min(2),
  fileType: z.string().trim().optional().or(z.literal("")),
  fileSizeBytes: z.coerce.number().int().min(0).optional(),
  purpose: z.string().trim().min(2).default("Campaign Document"),
});

function safePath(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  const auth = await requireSession(request, { roles: ["Candidate", "Campaign Manager", "Admin", "Data Clerk", "Media Team"] });
  if (auth.response) return auth.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Upload details are invalid." }, { status: 400 });

  const objectPath = `${auth.session.tenantId}/${Date.now()}-${safePath(parsed.data.fileName)}`;
  const admin = getLooseSupabaseAdmin();
  const { data, error } = await admin.from("file_upload_records").insert({
    tenant_id: auth.session.tenantId,
    candidate_id: auth.session.candidateId,
    uploaded_by: auth.session.memberId,
    object_path: objectPath,
    file_name: parsed.data.fileName,
    file_type: parsed.data.fileType || null,
    file_size_bytes: parsed.data.fileSizeBytes ?? null,
    purpose: parsed.data.purpose,
  }).select("id, bucket, object_path, status").single();

  if (error || !data) return NextResponse.json({ error: "Could not register upload." }, { status: 409 });

  await writeAudit({
    tenantId: auth.session.tenantId,
    candidateId: auth.session.candidateId,
    action: "Create",
    module: "Upload Register",
    recordId: data.id,
    newValue: { ...parsed.data, objectPath },
  });

  return NextResponse.json({ upload: data });
}
