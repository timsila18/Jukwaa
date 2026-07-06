import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { getLooseSupabaseAdmin } from "@/lib/supabase";
import { shortCode, writeAudit } from "@/lib/server-workflows";
import { requireSession } from "@/lib/auth-session";

const schema = z.object({
  fullName: z.string().trim().min(2),
  phoneNumber: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  role: z.enum(["Candidate", "Campaign Manager", "Constituency Coordinator", "Ward Coordinator", "Village Coordinator", "Volunteer", "Polling Agent", "Media Team", "Data Clerk", "Admin"]),
  geography: z.string().trim().optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const auth = await requireSession(request, { roles: ["Candidate", "Campaign Manager", "Admin", "Constituency Coordinator", "Ward Coordinator"] });
  if (auth.response) return auth.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (!parsed.data.phoneNumber && !parsed.data.email)) {
    return NextResponse.json({ error: "Name, role, and phone or email are required." }, { status: 400 });
  }

  const workspace = { tenantId: auth.session.tenantId, candidateId: auth.session.candidateId };
  const supabase = getLooseSupabaseAdmin();
  const invitationCode = shortCode("JUK");
  const { data, error } = await supabase.from("invitations").insert({
    tenant_id: workspace.tenantId,
    candidate_id: workspace.candidateId,
    invited_name: parsed.data.fullName,
    invited_phone: parsed.data.phoneNumber || null,
    invited_email: parsed.data.email || null,
    role: parsed.data.role,
    invited_by: auth.session.memberId,
    invitation_code: invitationCode,
    status: "Pending",
    expiry_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  }).select("id").single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not create invitation.", detail: error?.message }, { status: 409 });
  }

  if (parsed.data.role === "Volunteer" && parsed.data.phoneNumber) {
    const { error: volunteerError } = await supabase.from("volunteers").upsert({
      tenant_id: workspace.tenantId,
      candidate_id: workspace.candidateId,
      full_name: parsed.data.fullName,
      phone_number: parsed.data.phoneNumber,
      email: parsed.data.email || null,
      recruitment_source: "Team invitation",
      status: "Pending Approval",
    }, { onConflict: "tenant_id,phone_number", ignoreDuplicates: true });
    if (volunteerError) return NextResponse.json({ error: "Invitation was created, but the volunteer profile could not be provisioned.", detail: volunteerError.message }, { status: 500 });
  }

  if (parsed.data.role === "Polling Agent" && parsed.data.phoneNumber) {
    const { error: agentError } = await supabase.from("polling_agents").upsert({
      tenant_id: workspace.tenantId,
      candidate_id: workspace.candidateId,
      full_name: parsed.data.fullName,
      phone_number: parsed.data.phoneNumber,
      reporting_manager: auth.session.memberId,
      status: "Assigned",
    }, { onConflict: "tenant_id,phone_number", ignoreDuplicates: true });
    if (agentError) return NextResponse.json({ error: "Invitation was created, but the polling-agent profile could not be provisioned.", detail: agentError.message }, { status: 500 });
  }

  await writeAudit({
    tenantId: workspace.tenantId,
    candidateId: workspace.candidateId,
    action: "Create",
    module: "Invitation",
    recordId: data.id,
    newValue: { ...parsed.data, invitationCode },
  });

  let emailStatus: "Sent" | "Not requested" | "Not configured" | "Failed" = "Not requested";
  if (parsed.data.email) {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      emailStatus = "Not configured";
    } else {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
      const joinUrl = `${appUrl}/signup/user?code=${encodeURIComponent(invitationCode)}`;
      const sender = process.env.JUKWAA_EMAIL_FROM || "JUKWAA <info@jukwaakenya.co.ke>";
      const delivery = await new Resend(resendKey).emails.send({
        from: sender,
        to: parsed.data.email,
        subject: `You're invited to join ${parsed.data.role} on JUKWAA`,
        html: `<p>Hello ${parsed.data.fullName},</p><p>You have been invited to join a JUKWAA campaign workspace as <strong>${parsed.data.role}</strong>.</p><p><a href="${joinUrl}">Create your JUKWAA password and join the workspace</a></p><p>Your joining code: <strong>${invitationCode}</strong></p><p>This invitation expires in 14 days. If you were not expecting this invitation, you can ignore this email.</p>`,
        text: `Hello ${parsed.data.fullName},\n\nYou have been invited to join a JUKWAA campaign workspace as ${parsed.data.role}.\n\nJoin here: ${joinUrl}\nJoining code: ${invitationCode}\n\nThis invitation expires in 14 days.`,
      });
      emailStatus = delivery.error ? "Failed" : "Sent";
    }
  }

  return NextResponse.json({
    invitationId: data.id,
    invitationCode,
    joinUrl: `/signup/user?code=${encodeURIComponent(invitationCode)}`,
    expiresOn: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    emailStatus,
    whatsappUrl: parsed.data.phoneNumber
      ? `https://wa.me/${parsed.data.phoneNumber.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${parsed.data.fullName}, you have been invited to join JUKWAA as ${parsed.data.role}. Create your password and join here: ${(process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin)}/signup/user?code=${encodeURIComponent(invitationCode)}\n\nJoining code: ${invitationCode}\nThis code expires in 14 days.`)}`
      : null,
  });
}
