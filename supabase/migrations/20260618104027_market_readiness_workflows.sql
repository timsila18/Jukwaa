create type public.onboarding_status as enum ('Submitted', 'Payment Pending', 'Payment Submitted', 'Activated', 'Rejected');
create type public.activation_payment_channel as enum ('Manual Paybill', 'STK Push', 'Bank Transfer');
create type public.legal_document_type as enum ('Privacy Policy', 'Terms of Service', 'Data Consent', 'Candidate Data Ownership', 'Backup Policy');

create table public.candidate_onboarding_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone_number text not null,
  email citext,
  national_id text,
  position_contesting public.election_type not null,
  political_party text not null,
  county text,
  constituency text,
  ward text,
  campaign_name text not null,
  slogan text,
  plan public.subscription_plan not null default 'Professional',
  amount_due_kes numeric(12, 2) not null default 45000 check (amount_due_kes >= 0),
  status public.onboarding_status not null default 'Payment Pending',
  tenant_id uuid references public.tenants(id) on delete set null,
  candidate_id uuid references public.candidates(id) on delete set null,
  payment_reference text,
  submitted_at timestamptz not null default now(),
  activated_at timestamptz,
  unique (phone_number, campaign_name)
);

create table public.workspace_activation_payments (
  id uuid primary key default gen_random_uuid(),
  onboarding_application_id uuid references public.candidate_onboarding_applications(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete set null,
  candidate_id uuid references public.candidates(id) on delete set null,
  phone_number text not null,
  amount_kes numeric(12, 2) not null check (amount_kes > 0),
  channel public.activation_payment_channel not null default 'Manual Paybill',
  paybill_number text not null default 'CONFIGURE_PAYBILL',
  account_reference text not null,
  mpesa_receipt_number text,
  status public.payment_status not null default 'Pending',
  submitted_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unique (account_reference)
);

create table public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  candidate_id uuid references public.candidates(id) on delete cascade,
  feature text not null,
  prompt_tokens integer not null default 0 check (prompt_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  model text not null,
  status text not null default 'Completed',
  created_at timestamptz not null default now()
);

create table public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  document_type public.legal_document_type not null,
  title text not null,
  version text not null,
  body text not null,
  published_at timestamptz not null default now(),
  active boolean not null default true,
  unique (document_type, version)
);

create table public.support_contact_settings (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  label text not null,
  contact_value text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (channel, contact_value)
);

create index on public.candidate_onboarding_applications (status, submitted_at desc);
create index on public.workspace_activation_payments (status, submitted_at desc);
create index on public.ai_usage_events (tenant_id, candidate_id, created_at desc);
create index on public.legal_documents (document_type, active);

alter table public.candidate_onboarding_applications enable row level security;
alter table public.workspace_activation_payments enable row level security;
alter table public.ai_usage_events enable row level security;
alter table public.legal_documents enable row level security;
alter table public.support_contact_settings enable row level security;

create policy candidate_onboarding_public_insert on public.candidate_onboarding_applications
for insert to anon, authenticated
with check (true);

create policy candidate_onboarding_platform_read on public.candidate_onboarding_applications
for select to authenticated
using (app_private.is_platform_admin() or tenant_id in (select app_private.current_tenant_ids()));

create policy candidate_onboarding_platform_update on public.candidate_onboarding_applications
for update to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy activation_payments_public_insert on public.workspace_activation_payments
for insert to anon, authenticated
with check (true);

create policy activation_payments_read on public.workspace_activation_payments
for select to authenticated
using (app_private.is_platform_admin() or tenant_id in (select app_private.current_tenant_ids()));

create policy activation_payments_platform_update on public.workspace_activation_payments
for update to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy ai_usage_member_read on public.ai_usage_events
for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

create policy ai_usage_member_insert on public.ai_usage_events
for insert to authenticated
with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

create policy legal_documents_public_read on public.legal_documents
for select to anon, authenticated
using (active);

create policy legal_documents_platform_manage on public.legal_documents
for all to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy support_contacts_public_read on public.support_contact_settings
for select to anon, authenticated
using (active);

create policy support_contacts_platform_manage on public.support_contact_settings
for all to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

grant select, insert, update on public.candidate_onboarding_applications to anon, authenticated;
grant select, insert, update on public.workspace_activation_payments to anon, authenticated;
grant select, insert on public.ai_usage_events to authenticated;
grant select on public.legal_documents to anon, authenticated;
grant select on public.support_contact_settings to anon, authenticated;

insert into public.legal_documents (document_type, title, version, body)
values
  ('Privacy Policy', 'JUKWAA Privacy Policy', '2026.06', 'JUKWAA stores campaign, candidate, supporter, volunteer, payment, and communication data only for authorized campaign operations.'),
  ('Terms of Service', 'JUKWAA Terms of Service', '2026.06', 'Candidates are responsible for lawful campaign use, truthful records, authorized team access, and payment of subscription fees.'),
  ('Data Consent', 'Supporter and Volunteer Data Consent', '2026.06', 'Campaign teams must collect consent before contacting supporters, volunteers, agents, or community members.'),
  ('Candidate Data Ownership', 'Candidate Data Ownership Policy', '2026.06', 'Candidate workspaces remain isolated by tenant. Candidate data export is available through workspace reports and admin support.'),
  ('Backup Policy', 'Backup and Export Policy', '2026.06', 'Workspace data should be backed up through scheduled Supabase backups and CSV/XLSX/PDF exports.')
on conflict (document_type, version) do nothing;

insert into public.support_contact_settings (channel, label, contact_value)
values
  ('WhatsApp', 'JUKWAA Support WhatsApp', 'CONFIGURE_SUPPORT_WHATSAPP'),
  ('Email', 'JUKWAA Support Email', 'support@jukwaakenya.co.ke'),
  ('Phone', 'JUKWAA Candidate Onboarding', 'CONFIGURE_SUPPORT_PHONE')
on conflict (channel, contact_value) do nothing;
