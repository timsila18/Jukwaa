create type public.campaign_lifecycle_status as enum ('Draft', 'Active', 'Suspended', 'Completed', 'Archived');
create type public.invitation_status as enum ('Pending', 'Accepted', 'Expired', 'Revoked');
create type public.election_type as enum ('Presidential', 'Governor', 'Senator', 'Women Representative', 'MP', 'MCA', 'Party Election', 'Referendum');
create type public.subscription_plan as enum ('Starter', 'Professional', 'Advanced', 'Enterprise');
create type public.subscription_status as enum ('Trial', 'Active', 'Past Due', 'Expired', 'Cancelled');
create type public.invoice_status as enum ('Draft', 'Issued', 'Paid', 'Overdue', 'Void');
create type public.payment_method as enum ('M-Pesa STK Push', 'Paybill', 'Card Payment', 'Bank Transfer');
create type public.payment_status as enum ('Pending', 'Confirmed', 'Failed');
create type public.login_event_type as enum ('Login', 'Failed Login', 'Password Updated', 'Device Added', 'Session Revoked');
create type public.support_ticket_status as enum ('Open', 'In Progress', 'Resolved', 'Closed');

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null,
  phone_number text not null,
  email citext,
  national_id text,
  gender text,
  date_of_birth date,
  profile_photo text,
  political_party text,
  position_contesting text not null,
  county text,
  constituency text,
  ward text,
  campaign_name text not null,
  slogan text,
  biography text,
  campaign_start_date date,
  campaign_end_date date,
  active_status public.campaign_lifecycle_status not null default 'Draft',
  verification_status public.verification_status not null default 'Pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id),
  unique (tenant_id, phone_number)
);

create table public.platform_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email citext not null unique,
  full_name text not null,
  status public.user_status not null default 'Active',
  created_at timestamptz not null default now()
);

create table public.elections (
  id uuid primary key default gen_random_uuid(),
  election_name text not null,
  country text not null default 'Kenya',
  election_type public.election_type not null,
  election_date date not null,
  status public.campaign_lifecycle_status not null default 'Draft',
  created_at timestamptz not null default now(),
  unique (country, election_name, election_type, election_date)
);

create table public.candidate_elections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  election_id uuid not null references public.elections(id) on delete cascade,
  campaign_status public.campaign_lifecycle_status not null default 'Draft',
  created_at timestamptz not null default now(),
  unique (candidate_id, election_id)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  invited_name text not null,
  invited_phone text,
  invited_email citext,
  role public.campaign_role not null,
  invited_by uuid references public.campaign_members(id),
  invitation_code text not null unique,
  status public.invitation_status not null default 'Pending',
  expiry_date date not null,
  created_at timestamptz not null default now(),
  check (invited_phone is not null or invited_email is not null)
);

create table public.workspace_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  plan public.subscription_plan not null,
  start_date date not null,
  expiry_date date not null,
  status public.subscription_status not null default 'Trial',
  user_limit integer not null check (user_limit > 0),
  volunteer_limit integer not null check (volunteer_limit > 0),
  polling_agent_limit integer not null check (polling_agent_limit > 0),
  storage_limit_gb integer not null check (storage_limit_gb > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, candidate_id)
);

create table public.subscription_entitlements (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.workspace_subscriptions(id) on delete cascade,
  ai_access boolean not null default false,
  sms_access boolean not null default false,
  whatsapp_access boolean not null default false,
  polling_agent_limit integer not null check (polling_agent_limit >= 0),
  storage_limit_gb integer not null check (storage_limit_gb >= 0),
  user_limit integer not null check (user_limit >= 0),
  created_at timestamptz not null default now(),
  unique (subscription_id)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  subscription_id uuid references public.workspace_subscriptions(id),
  invoice_number text not null unique,
  amount_kes numeric(12, 2) not null check (amount_kes >= 0),
  status public.invoice_status not null default 'Draft',
  due_date date not null,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  invoice_id uuid references public.invoices(id),
  method public.payment_method not null,
  amount_kes numeric(12, 2) not null check (amount_kes >= 0),
  status public.payment_status not null default 'Pending',
  reference text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, reference)
);

create table public.workspace_audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid references public.candidates(id) on delete set null,
  actor_user_id uuid references auth.users(id),
  actor_member_id uuid references public.campaign_members(id),
  action text not null,
  module text not null,
  record_id text,
  previous_value jsonb,
  new_value jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create table public.user_devices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  member_id uuid references public.campaign_members(id) on delete cascade,
  device_name text not null,
  device_fingerprint text not null,
  last_ip_address inet,
  last_seen_at timestamptz not null default now(),
  trusted boolean not null default false,
  unique (tenant_id, device_fingerprint)
);

create table public.login_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  candidate_id uuid references public.candidates(id) on delete cascade,
  member_id uuid references public.campaign_members(id) on delete cascade,
  event_type public.login_event_type not null,
  phone_number text,
  email citext,
  device_name text,
  ip_address inet,
  success boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  candidate_id uuid references public.candidates(id) on delete cascade,
  title text not null,
  description text,
  status public.support_ticket_status not null default 'Open',
  priority public.priority_level not null default 'Medium',
  created_by uuid references public.campaign_members(id),
  assigned_to_platform_admin uuid references public.platform_admins(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.campaign_settings add column candidate_id uuid references public.candidates(id);
alter table public.campaign_settings add column active_status public.campaign_lifecycle_status not null default 'Active';
alter table public.campaign_members add column candidate_id uuid references public.candidates(id);
alter table public.supporters add column candidate_id uuid references public.candidates(id);
alter table public.supporter_interactions add column candidate_id uuid references public.candidates(id);
alter table public.volunteers add column candidate_id uuid references public.candidates(id);
alter table public.volunteer_tasks add column candidate_id uuid references public.candidates(id);
alter table public.field_visits add column candidate_id uuid references public.candidates(id);
alter table public.intelligence_reports add column candidate_id uuid references public.candidates(id);
alter table public.community_issues add column candidate_id uuid references public.candidates(id);
alter table public.campaign_events add column candidate_id uuid references public.candidates(id);
alter table public.event_check_ins add column candidate_id uuid references public.candidates(id);
alter table public.internal_notifications add column candidate_id uuid references public.candidates(id);
alter table public.polling_agents add column candidate_id uuid references public.candidates(id);
alter table public.agent_check_ins add column candidate_id uuid references public.candidates(id);
alter table public.turnout_updates add column candidate_id uuid references public.candidates(id);
alter table public.election_incidents add column candidate_id uuid references public.candidates(id);
alter table public.election_forms add column candidate_id uuid references public.candidates(id);
alter table public.polling_results add column candidate_id uuid references public.candidates(id);
alter table public.election_alerts add column candidate_id uuid references public.candidates(id);
alter table public.offline_submission_queue add column candidate_id uuid references public.candidates(id);

do $$
declare
  tenant_row record;
  candidate_row uuid;
  manager_member uuid;
  sub_id uuid;
  election_2027 uuid;
  election_2032 uuid;
  election_party uuid;
  invoice_paid uuid;
begin
  for tenant_row in
    select
      t.id as tenant_id,
      t.name as tenant_name,
      coalesce(cs.candidate_name, t.name) as candidate_name,
      coalesce(cs.campaign_name, t.name) as campaign_name,
      coalesce(cs.position_targeted, 'MP') as position_targeted,
      coalesce(cs.political_party, 'Independent Candidate') as political_party,
      coalesce(cs.county, 'Configurable County') as county,
      coalesce(cs.constituency, 'Central Constituency') as constituency,
      coalesce(cs.slogan, 'Service, dignity, delivery') as slogan
    from public.tenants t
    left join public.campaign_settings cs on cs.tenant_id = t.id
  loop
    insert into public.candidates (
      tenant_id,
      full_name,
      phone_number,
      email,
      national_id,
      gender,
      date_of_birth,
      profile_photo,
      political_party,
      position_contesting,
      county,
      constituency,
      ward,
      campaign_name,
      slogan,
      biography,
      campaign_start_date,
      campaign_end_date,
      active_status,
      verification_status
    )
    values (
      tenant_row.tenant_id,
      tenant_row.candidate_name,
      '+254700111222',
      'candidate@jukwaa.app',
      'ID-0001',
      'Male',
      '1984-04-12',
      '/candidate/john-doe.jpg',
      tenant_row.political_party,
      tenant_row.position_targeted,
      tenant_row.county,
      tenant_row.constituency,
      'All wards',
      tenant_row.campaign_name,
      tenant_row.slogan,
      'Community advocate focused on service delivery, youth jobs, and accountable local leadership.',
      '2026-01-15',
      '2027-08-30',
      'Active',
      'Verified'
    )
    on conflict (tenant_id) do update set
      full_name = excluded.full_name,
      campaign_name = excluded.campaign_name,
      position_contesting = excluded.position_contesting,
      updated_at = now()
    returning id into candidate_row;

    update public.campaign_settings set candidate_id = candidate_row where tenant_id = tenant_row.tenant_id;
    update public.campaign_members set candidate_id = candidate_row where tenant_id = tenant_row.tenant_id;
    update public.supporters set candidate_id = candidate_row where tenant_id = tenant_row.tenant_id;
    update public.supporter_interactions set candidate_id = candidate_row where tenant_id = tenant_row.tenant_id;
    update public.volunteers set candidate_id = candidate_row where tenant_id = tenant_row.tenant_id;
    update public.volunteer_tasks set candidate_id = candidate_row where tenant_id = tenant_row.tenant_id;
    update public.field_visits set candidate_id = candidate_row where tenant_id = tenant_row.tenant_id;
    update public.intelligence_reports set candidate_id = candidate_row where tenant_id = tenant_row.tenant_id;
    update public.community_issues set candidate_id = candidate_row where tenant_id = tenant_row.tenant_id;
    update public.campaign_events set candidate_id = candidate_row where tenant_id = tenant_row.tenant_id;
    update public.event_check_ins set candidate_id = candidate_row where tenant_id = tenant_row.tenant_id;
    update public.internal_notifications set candidate_id = candidate_row where tenant_id = tenant_row.tenant_id;
    update public.polling_agents set candidate_id = candidate_row where tenant_id = tenant_row.tenant_id;
    update public.agent_check_ins set candidate_id = candidate_row where tenant_id = tenant_row.tenant_id;
    update public.turnout_updates set candidate_id = candidate_row where tenant_id = tenant_row.tenant_id;
    update public.election_incidents set candidate_id = candidate_row where tenant_id = tenant_row.tenant_id;
    update public.election_forms set candidate_id = candidate_row where tenant_id = tenant_row.tenant_id;
    update public.polling_results set candidate_id = candidate_row where tenant_id = tenant_row.tenant_id;
    update public.election_alerts set candidate_id = candidate_row where tenant_id = tenant_row.tenant_id;
    update public.offline_submission_queue set candidate_id = candidate_row where tenant_id = tenant_row.tenant_id;

    select id into manager_member from public.campaign_members where tenant_id = tenant_row.tenant_id and role = 'Campaign Manager' limit 1;

    insert into public.invitations (tenant_id, candidate_id, invited_name, invited_phone, invited_email, role, invited_by, invitation_code, status, expiry_date)
    values
      (tenant_row.tenant_id, candidate_row, 'Mary Field', '+254711000101', 'manager@jukwaa.app', 'Campaign Manager', manager_member, 'JUK-MARY-2027', 'Accepted', '2026-02-01'),
      (tenant_row.tenant_id, candidate_row, 'Peter Data', '+254711000102', 'data@jukwaa.app', 'Data Clerk', manager_member, 'JUK-DATA-2027', 'Accepted', '2026-02-05'),
      (tenant_row.tenant_id, candidate_row, 'Grace Ward', '+254711000103', 'grace@jukwaa.app', 'Ward Coordinator', manager_member, 'JUK-WARD-4821', 'Pending', '2026-06-25')
    on conflict (invitation_code) do nothing;

    insert into public.workspace_subscriptions (tenant_id, candidate_id, plan, start_date, expiry_date, status, user_limit, volunteer_limit, polling_agent_limit, storage_limit_gb)
    values (tenant_row.tenant_id, candidate_row, 'Professional', '2026-01-15', '2027-09-15', 'Active', 50, 500, 300, 100)
    on conflict (tenant_id, candidate_id) do update set status = excluded.status, updated_at = now()
    returning id into sub_id;

    insert into public.subscription_entitlements (subscription_id, ai_access, sms_access, whatsapp_access, polling_agent_limit, storage_limit_gb, user_limit)
    values (sub_id, false, true, true, 300, 100, 50)
    on conflict (subscription_id) do update set
      ai_access = excluded.ai_access,
      sms_access = excluded.sms_access,
      whatsapp_access = excluded.whatsapp_access,
      polling_agent_limit = excluded.polling_agent_limit,
      storage_limit_gb = excluded.storage_limit_gb,
      user_limit = excluded.user_limit;

    insert into public.elections (election_name, country, election_type, election_date, status)
    values
      ('Kenya General Election 2027', 'Kenya', 'MP', '2027-08-09', 'Active'),
      ('Kenya General Election 2032', 'Kenya', 'MP', '2032-08-10', 'Draft'),
      ('Party Nomination 2026', 'Kenya', 'Party Election', '2026-11-20', 'Draft')
    on conflict (country, election_name, election_type, election_date) do nothing;

    select id into election_2027 from public.elections where election_name = 'Kenya General Election 2027' and election_type = 'MP' limit 1;
    select id into election_2032 from public.elections where election_name = 'Kenya General Election 2032' and election_type = 'MP' limit 1;
    select id into election_party from public.elections where election_name = 'Party Nomination 2026' and election_type = 'Party Election' limit 1;

    insert into public.candidate_elections (tenant_id, candidate_id, election_id, campaign_status)
    values
      (tenant_row.tenant_id, candidate_row, election_2027, 'Active'),
      (tenant_row.tenant_id, candidate_row, election_2032, 'Draft'),
      (tenant_row.tenant_id, candidate_row, election_party, 'Draft')
    on conflict (candidate_id, election_id) do nothing;

    insert into public.invoices (tenant_id, candidate_id, subscription_id, invoice_number, amount_kes, status, due_date)
    values
      (tenant_row.tenant_id, candidate_row, sub_id, 'JUK-2026-0001', 45000, 'Paid', '2026-02-01'),
      (tenant_row.tenant_id, candidate_row, sub_id, 'JUK-2027-0007', 45000, 'Issued', '2027-01-15')
    on conflict (invoice_number) do nothing;

    select id into invoice_paid from public.invoices where tenant_id = tenant_row.tenant_id and invoice_number = 'JUK-2026-0001' limit 1;

    insert into public.payments (tenant_id, candidate_id, invoice_id, method, amount_kes, status, reference)
    values
      (tenant_row.tenant_id, candidate_row, invoice_paid, 'M-Pesa STK Push', 45000, 'Confirmed', 'QBJ7X9KD2'),
      (tenant_row.tenant_id, candidate_row, null, 'Bank Transfer', 45000, 'Pending', 'BANK-2027-0007')
    on conflict (tenant_id, reference) do nothing;

    insert into public.workspace_audit_logs (tenant_id, candidate_id, actor_member_id, action, module, record_id, new_value)
    values
      (tenant_row.tenant_id, candidate_row, manager_member, 'Create', 'Candidate Workspace', candidate_row::text, jsonb_build_object('workspace', tenant_row.campaign_name)),
      (tenant_row.tenant_id, candidate_row, manager_member, 'Update', 'Subscription', sub_id::text, jsonb_build_object('plan', 'Professional'));

    insert into public.login_history (tenant_id, candidate_id, member_id, event_type, phone_number, email, device_name, ip_address, success)
    values
      (tenant_row.tenant_id, candidate_row, manager_member, 'Login', '+254711000101', 'manager@jukwaa.app', 'Chrome on Android', '196.201.12.44', true),
      (tenant_row.tenant_id, candidate_row, manager_member, 'Failed Login', '+254711000101', 'manager@jukwaa.app', 'Windows Desktop', '196.201.12.88', false);

    insert into public.support_tickets (tenant_id, candidate_id, title, description, status, priority, created_by)
    values
      (tenant_row.tenant_id, candidate_row, 'Verify candidate documents', 'Review national ID and campaign ownership documents.', 'Open', 'High', manager_member),
      (tenant_row.tenant_id, candidate_row, 'Subscription onboarding', 'Confirm payment framework before live billing.', 'In Progress', 'Medium', manager_member);
  end loop;
end $$;

alter table public.campaign_settings alter column candidate_id set not null;
alter table public.campaign_members alter column candidate_id set not null;
alter table public.supporters alter column candidate_id set not null;
alter table public.volunteers alter column candidate_id set not null;
alter table public.polling_agents alter column candidate_id set not null;

create unique index one_candidate_member_per_tenant on public.campaign_members (tenant_id, candidate_id) where role = 'Candidate' and status = 'Active';
create index on public.candidates (tenant_id, active_status, verification_status);
create index on public.invitations (tenant_id, candidate_id, status, expiry_date);
create index on public.candidate_elections (tenant_id, candidate_id, campaign_status);
create index on public.workspace_subscriptions (tenant_id, candidate_id, status, expiry_date);
create index on public.invoices (tenant_id, candidate_id, status, due_date);
create index on public.payments (tenant_id, candidate_id, status, created_at desc);
create index on public.workspace_audit_logs (tenant_id, candidate_id, created_at desc);
create index on public.login_history (tenant_id, candidate_id, event_type, created_at desc);
create index on public.support_tickets (tenant_id, candidate_id, status, priority);

create or replace function app_private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins
    where user_id = auth.uid()
      and status = 'Active'
  );
$$;

grant execute on function app_private.is_platform_admin() to authenticated;

create or replace function app_private.prevent_workspace_audit_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'workspace_audit_logs are immutable';
end;
$$;

create trigger workspace_audit_logs_immutable_update
before update or delete on public.workspace_audit_logs
for each row execute function app_private.prevent_workspace_audit_mutation();

alter table public.candidates enable row level security;
alter table public.platform_admins enable row level security;
alter table public.elections enable row level security;
alter table public.candidate_elections enable row level security;
alter table public.invitations enable row level security;
alter table public.workspace_subscriptions enable row level security;
alter table public.subscription_entitlements enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.workspace_audit_logs enable row level security;
alter table public.user_devices enable row level security;
alter table public.login_history enable row level security;
alter table public.support_tickets enable row level security;

create policy "members can read candidates" on public.candidates for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "candidate owners and platform admins can update candidates" on public.candidates for update to authenticated
using (app_private.has_tenant_role(tenant_id, array['Candidate','Admin']::public.campaign_role[]) or app_private.is_platform_admin())
with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

create policy "platform admins can manage platform admins" on public.platform_admins for all to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy "members can read elections" on public.elections for select to authenticated
using (true);
create policy "platform admins can manage elections" on public.elections for all to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy "members can read candidate elections" on public.candidate_elections for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "owners can manage candidate elections" on public.candidate_elections for all to authenticated
using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin']::public.campaign_role[]) or app_private.is_platform_admin())
with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

create policy "members can read invitations" on public.invitations for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "managers can create invitations" on public.invitations for insert to authenticated
with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Admin']::public.campaign_role[]) or app_private.is_platform_admin());
create policy "owners and managers can update invitations" on public.invitations for update to authenticated
using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin']::public.campaign_role[]) or app_private.is_platform_admin())
with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

create policy "members can read subscriptions" on public.workspace_subscriptions for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "platform admins can manage subscriptions" on public.workspace_subscriptions for all to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy "members can read entitlements" on public.subscription_entitlements for select to authenticated
using (subscription_id in (select id from public.workspace_subscriptions where tenant_id in (select app_private.current_tenant_ids())) or app_private.is_platform_admin());
create policy "platform admins can manage entitlements" on public.subscription_entitlements for all to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy "members can read invoices" on public.invoices for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "platform admins can manage invoices" on public.invoices for all to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy "members can read payments" on public.payments for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "platform admins can manage payments" on public.payments for all to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy "members can read workspace audit logs" on public.workspace_audit_logs for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "members can append workspace audit logs" on public.workspace_audit_logs for insert to authenticated
with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

create policy "members can read user devices" on public.user_devices for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "members can manage user devices" on public.user_devices for all to authenticated
using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin())
with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

create policy "members can read login history" on public.login_history for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "members can append login history" on public.login_history for insert to authenticated
with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin() or tenant_id is null);

create policy "members can read support tickets" on public.support_tickets for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "members can create support tickets" on public.support_tickets for insert to authenticated
with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "members and platform admins can update support tickets" on public.support_tickets for update to authenticated
using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin())
with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

grant select, insert, update, delete on public.candidates to authenticated;
grant select, insert, update, delete on public.platform_admins to authenticated;
grant select, insert, update, delete on public.elections to authenticated;
grant select, insert, update, delete on public.candidate_elections to authenticated;
grant select, insert, update, delete on public.invitations to authenticated;
grant select, insert, update, delete on public.workspace_subscriptions to authenticated;
grant select, insert, update, delete on public.subscription_entitlements to authenticated;
grant select, insert, update, delete on public.invoices to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
grant select, insert on public.workspace_audit_logs to authenticated;
grant select, insert, update, delete on public.user_devices to authenticated;
grant select, insert on public.login_history to authenticated;
grant select, insert, update, delete on public.support_tickets to authenticated;
