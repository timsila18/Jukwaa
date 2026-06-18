create type public.finance_category as enum ('Fuel', 'Events', 'Salaries', 'Marketing', 'Printing', 'Logistics', 'Accommodation', 'Security', 'Media', 'Miscellaneous');
create type public.donor_type as enum ('Individual', 'Corporate', 'Event Contribution');
create type public.fundraising_status as enum ('Draft', 'Active', 'Paused', 'Closed');
create type public.ai_asset_status as enum ('Draft', 'Approved', 'Published');
create type public.document_category as enum ('Campaign Document', 'Contract', 'Budget', 'Training Material', 'Result Form', 'Regulation');
create type public.mpesa_transaction_purpose as enum ('Donation', 'Subscription', 'Fundraising');
create type public.mpesa_channel as enum ('STK Push', 'Paybill', 'Till Number');

create table public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  title text not null,
  description text not null,
  impact_score integer not null check (impact_score between 0 and 100),
  category text not null,
  source text not null,
  created_at timestamptz not null default now()
);

create table public.ai_content_assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  asset_type text not null,
  title text not null,
  audience text,
  body text,
  status public.ai_asset_status not null default 'Draft',
  created_by uuid references public.campaign_members(id),
  created_at timestamptz not null default now()
);

create table public.finance_donations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  donor_name text not null,
  donor_type public.donor_type not null,
  phone text,
  email citext,
  amount_kes numeric(12, 2) not null check (amount_kes > 0),
  donation_date date not null,
  payment_method public.payment_method not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.finance_expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  vendor text not null,
  category public.finance_category not null,
  amount_kes numeric(12, 2) not null check (amount_kes > 0),
  expense_date date not null,
  status text not null default 'Pending Approval',
  receipt_url text,
  approved_by uuid references public.campaign_members(id),
  created_at timestamptz not null default now()
);

create table public.campaign_budgets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  category public.finance_category not null,
  budgeted_kes numeric(12, 2) not null check (budgeted_kes >= 0),
  actual_kes numeric(12, 2) not null default 0 check (actual_kes >= 0),
  created_by uuid references public.campaign_members(id),
  created_at timestamptz not null default now(),
  unique (tenant_id, candidate_id, category)
);

create table public.fundraising_campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  title text not null,
  goal_amount_kes numeric(12, 2) not null check (goal_amount_kes > 0),
  raised_kes numeric(12, 2) not null default 0 check (raised_kes >= 0),
  target_date date not null,
  description text,
  status public.fundraising_status not null default 'Draft',
  created_at timestamptz not null default now()
);

create table public.mpesa_payment_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  business_number text not null default 'CONFIGURE_PAYBILL',
  till_number text,
  account_reference_format text not null default 'JUKWAA-{workspace}-{invoice}',
  callback_url text not null,
  stk_push_enabled boolean not null default true,
  paybill_enabled boolean not null default true,
  till_enabled boolean not null default false,
  live_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, candidate_id)
);

create table public.mpesa_transaction_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  purpose public.mpesa_transaction_purpose not null,
  phone text not null,
  amount_kes numeric(12, 2) not null check (amount_kes > 0),
  channel public.mpesa_channel not null,
  account_reference text not null,
  checkout_request_id text,
  merchant_request_id text,
  mpesa_receipt_number text,
  raw_payload jsonb not null default '{}'::jsonb,
  status public.payment_status not null default 'Pending',
  created_at timestamptz not null default now()
);

create table public.predictive_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  metric text not null,
  estimate numeric(5, 2) not null check (estimate >= 0 and estimate <= 100),
  label text not null,
  caveat text not null default 'Strategic estimate based on available campaign data.',
  created_at timestamptz not null default now()
);

create table public.scenario_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  title text not null,
  turnout_shift numeric(5, 2) not null default 0,
  volunteer_increase numeric(5, 2) not null default 0,
  additional_spend_kes numeric(12, 2) not null default 0,
  projected_impact text not null,
  created_by uuid references public.campaign_members(id),
  created_at timestamptz not null default now()
);

create table public.campaign_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  title text not null,
  category public.document_category not null,
  file_path text,
  version text not null default 'v1.0',
  permission text not null default 'Managers',
  uploaded_by uuid references public.campaign_members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  candidate_id uuid references public.candidates(id) on delete cascade,
  title text not null,
  category text not null,
  audience text,
  body text,
  searchable_text tsvector generated always as (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(body, ''))) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.push_notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  title text not null,
  body text not null,
  notification_type text not null,
  target_role public.campaign_role,
  status public.notification_status not null default 'Unread',
  created_at timestamptz not null default now()
);

create table public.country_configurations (
  id uuid primary key default gen_random_uuid(),
  country text not null unique,
  geography_levels text[] not null,
  election_types public.election_type[] not null,
  currency_code text not null default 'KES',
  default_phone_country_code text not null default '+254',
  created_at timestamptz not null default now()
);

create table public.backup_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  candidate_id uuid references public.candidates(id) on delete cascade,
  backup_type text not null,
  status text not null,
  storage_path text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index on public.ai_recommendations (tenant_id, candidate_id, impact_score desc);
create index on public.finance_donations (tenant_id, candidate_id, donation_date desc);
create index on public.finance_expenses (tenant_id, candidate_id, category, expense_date desc);
create index on public.campaign_budgets (tenant_id, candidate_id, category);
create index on public.fundraising_campaigns (tenant_id, candidate_id, status, target_date);
create index on public.mpesa_transaction_logs (tenant_id, candidate_id, status, created_at desc);
create index on public.predictive_snapshots (tenant_id, candidate_id, created_at desc);
create index on public.scenario_plans (tenant_id, candidate_id, created_at desc);
create index on public.campaign_documents (tenant_id, candidate_id, category, updated_at desc);
create index knowledge_articles_search_idx on public.knowledge_articles using gin (searchable_text);
create index on public.push_notifications (tenant_id, candidate_id, target_role, created_at desc);
create index on public.backup_runs (tenant_id, candidate_id, started_at desc);

alter table public.ai_recommendations enable row level security;
alter table public.ai_content_assets enable row level security;
alter table public.finance_donations enable row level security;
alter table public.finance_expenses enable row level security;
alter table public.campaign_budgets enable row level security;
alter table public.fundraising_campaigns enable row level security;
alter table public.mpesa_payment_settings enable row level security;
alter table public.mpesa_transaction_logs enable row level security;
alter table public.predictive_snapshots enable row level security;
alter table public.scenario_plans enable row level security;
alter table public.campaign_documents enable row level security;
alter table public.knowledge_articles enable row level security;
alter table public.push_notifications enable row level security;
alter table public.country_configurations enable row level security;
alter table public.backup_runs enable row level security;

create policy "members can read ai recommendations" on public.ai_recommendations for select to authenticated using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "managers can manage ai recommendations" on public.ai_recommendations for all to authenticated using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin']::public.campaign_role[]) or app_private.is_platform_admin()) with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "members can read ai content" on public.ai_content_assets for select to authenticated using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "managers can manage ai content" on public.ai_content_assets for all to authenticated using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Media Team','Admin']::public.campaign_role[]) or app_private.is_platform_admin()) with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

create policy "members can read donations" on public.finance_donations for select to authenticated using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "finance managers can manage donations" on public.finance_donations for all to authenticated using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin']::public.campaign_role[]) or app_private.is_platform_admin()) with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "members can read expenses" on public.finance_expenses for select to authenticated using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "finance managers can manage expenses" on public.finance_expenses for all to authenticated using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin']::public.campaign_role[]) or app_private.is_platform_admin()) with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "members can read budgets" on public.campaign_budgets for select to authenticated using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "finance managers can manage budgets" on public.campaign_budgets for all to authenticated using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin']::public.campaign_role[]) or app_private.is_platform_admin()) with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "members can read fundraising" on public.fundraising_campaigns for select to authenticated using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "finance managers can manage fundraising" on public.fundraising_campaigns for all to authenticated using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin']::public.campaign_role[]) or app_private.is_platform_admin()) with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

create policy "members can read mpesa settings" on public.mpesa_payment_settings for select to authenticated using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "platform admins can manage mpesa settings" on public.mpesa_payment_settings for all to authenticated using (app_private.is_platform_admin()) with check (app_private.is_platform_admin());
create policy "members can read mpesa logs" on public.mpesa_transaction_logs for select to authenticated using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "payment services can append mpesa logs" on public.mpesa_transaction_logs for insert to authenticated with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "platform admins can update mpesa logs" on public.mpesa_transaction_logs for update to authenticated using (app_private.is_platform_admin()) with check (app_private.is_platform_admin());

create policy "members can read predictive snapshots" on public.predictive_snapshots for select to authenticated using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "managers can manage predictive snapshots" on public.predictive_snapshots for all to authenticated using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin']::public.campaign_role[]) or app_private.is_platform_admin()) with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "members can read scenario plans" on public.scenario_plans for select to authenticated using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "managers can manage scenario plans" on public.scenario_plans for all to authenticated using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin']::public.campaign_role[]) or app_private.is_platform_admin()) with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

create policy "members can read campaign documents" on public.campaign_documents for select to authenticated using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "managers can manage campaign documents" on public.campaign_documents for all to authenticated using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Data Clerk','Admin']::public.campaign_role[]) or app_private.is_platform_admin()) with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "members can read knowledge articles" on public.knowledge_articles for select to authenticated using (tenant_id is null or tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "managers can manage knowledge articles" on public.knowledge_articles for all to authenticated using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin()) with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

create policy "members can read push notifications" on public.push_notifications for select to authenticated using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "managers can create push notifications" on public.push_notifications for insert to authenticated with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin']::public.campaign_role[]) or app_private.is_platform_admin());
create policy "members can read country configs" on public.country_configurations for select to authenticated using (true);
create policy "platform admins can manage country configs" on public.country_configurations for all to authenticated using (app_private.is_platform_admin()) with check (app_private.is_platform_admin());
create policy "members can read backup runs" on public.backup_runs for select to authenticated using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());
create policy "platform admins can manage backup runs" on public.backup_runs for all to authenticated using (app_private.is_platform_admin()) with check (app_private.is_platform_admin());

grant select, insert, update, delete on public.ai_recommendations to authenticated;
grant select, insert, update, delete on public.ai_content_assets to authenticated;
grant select, insert, update, delete on public.finance_donations to authenticated;
grant select, insert, update, delete on public.finance_expenses to authenticated;
grant select, insert, update, delete on public.campaign_budgets to authenticated;
grant select, insert, update, delete on public.fundraising_campaigns to authenticated;
grant select, insert, update, delete on public.mpesa_payment_settings to authenticated;
grant select, insert, update on public.mpesa_transaction_logs to authenticated;
grant select, insert, update, delete on public.predictive_snapshots to authenticated;
grant select, insert, update, delete on public.scenario_plans to authenticated;
grant select, insert, update, delete on public.campaign_documents to authenticated;
grant select, insert, update, delete on public.knowledge_articles to authenticated;
grant select, insert, update on public.push_notifications to authenticated;
grant select, insert, update, delete on public.country_configurations to authenticated;
grant select, insert, update, delete on public.backup_runs to authenticated;

insert into public.country_configurations (country, geography_levels, election_types, currency_code, default_phone_country_code)
values ('Kenya', array['Country','County','Constituency','Ward','Village','Polling Station'], array['Presidential','Governor','Senator','Women Representative','MP','MCA','Party Election','Referendum']::public.election_type[], 'KES', '+254')
on conflict (country) do nothing;

do $$
declare
  demo_tenant uuid;
  demo_candidate uuid;
  manager_member uuid;
begin
  select id into demo_tenant from public.tenants where slug = 'demo-campaign';
  select id into demo_candidate from public.candidates where tenant_id = demo_tenant limit 1;
  select id into manager_member from public.campaign_members where tenant_id = demo_tenant and role = 'Campaign Manager' limit 1;
  if demo_tenant is null or demo_candidate is null then
    return;
  end if;

  insert into public.ai_recommendations (tenant_id, candidate_id, title, description, impact_score, category, source)
  values
    (demo_tenant, demo_candidate, 'Increase volunteer activity in Mto', 'River Road Center has low coverage and an unresolved election-day incident.', 92, 'Action', 'Coverage + incident trends'),
    (demo_tenant, demo_candidate, 'Run a youth jobs meeting near Green Primary', 'Youth employment is a top concern and the station has persuadable voters.', 86, 'Opportunity', 'Supporter issues + polling station data'),
    (demo_tenant, demo_candidate, 'Audit River Road form workflow', 'Rejected form and offline agent activity increase results risk.', 74, 'Risk', 'PVT quality queue');

  insert into public.ai_content_assets (tenant_id, candidate_id, asset_type, title, audience, status, created_by)
  values
    (demo_tenant, demo_candidate, 'Rally Speech', 'Service delivery rally speech', 'Ward rally', 'Draft', manager_member),
    (demo_tenant, demo_candidate, 'Social Caption', 'Youth jobs carousel caption', '18-34 voters', 'Approved', manager_member);

  insert into public.finance_donations (tenant_id, candidate_id, donor_name, donor_type, phone, email, amount_kes, donation_date, payment_method, notes)
  values
    (demo_tenant, demo_candidate, 'Amina Wanjiru', 'Individual', '+254710000000', 'amina@example.com', 2500, '2026-06-15', 'Paybill', 'Monthly supporter contribution.'),
    (demo_tenant, demo_candidate, 'Central Traders Sacco', 'Corporate', '+254720222333', 'treasurer@traders.example', 50000, '2026-06-16', 'M-Pesa STK Push', 'Fundraising breakfast pledge.'),
    (demo_tenant, demo_candidate, 'Kijiji Town Hall Guests', 'Event Contribution', '+254733444555', 'events@jukwaa.app', 18700, '2026-06-19', 'Paybill', 'Event collection.');

  insert into public.finance_expenses (tenant_id, candidate_id, vendor, category, amount_kes, expense_date, status, receipt_url, approved_by)
  values
    (demo_tenant, demo_candidate, 'Bridge Fuel Station', 'Fuel', 8400, '2026-06-17', 'Paid', '/receipts/fuel-001.pdf', manager_member),
    (demo_tenant, demo_candidate, 'Mlimani Printers', 'Printing', 32000, '2026-06-18', 'Approved', '/receipts/printing-002.pdf', manager_member),
    (demo_tenant, demo_candidate, 'Community Grounds PA', 'Events', 45000, '2026-06-22', 'Pending Approval', '/receipts/events-003.pdf', manager_member);

  insert into public.campaign_budgets (tenant_id, candidate_id, category, budgeted_kes, actual_kes, created_by)
  values
    (demo_tenant, demo_candidate, 'Fuel', 120000, 38400, manager_member),
    (demo_tenant, demo_candidate, 'Events', 450000, 184000, manager_member),
    (demo_tenant, demo_candidate, 'Printing', 180000, 92000, manager_member),
    (demo_tenant, demo_candidate, 'Marketing', 250000, 76000, manager_member)
  on conflict (tenant_id, candidate_id, category) do nothing;

  insert into public.fundraising_campaigns (tenant_id, candidate_id, title, goal_amount_kes, raised_kes, target_date, description, status)
  values
    (demo_tenant, demo_candidate, 'Ward Mobilization Fund', 300000, 158700, '2026-07-15', 'Transport, volunteer meals, and rally logistics.', 'Active'),
    (demo_tenant, demo_candidate, 'Polling Agent Training', 180000, 72000, '2026-08-01', 'Training material, venue, and agent support.', 'Active');

  insert into public.mpesa_payment_settings (tenant_id, candidate_id, business_number, account_reference_format, callback_url, stk_push_enabled, paybill_enabled, till_enabled, live_mode)
  values (demo_tenant, demo_candidate, 'CONFIGURE_PAYBILL', 'JUKWAA-{workspace}-{invoice}', 'https://jukwaakenya.co.ke/api/payments/mpesa/callback', true, true, false, false)
  on conflict (tenant_id, candidate_id) do nothing;

  insert into public.mpesa_transaction_logs (tenant_id, candidate_id, purpose, phone, amount_kes, channel, account_reference, checkout_request_id, mpesa_receipt_number, status)
  values
    (demo_tenant, demo_candidate, 'Subscription', '+254700111222', 45000, 'Paybill', 'JUKWAA-JOHNDOE-JUK-2026-0001', 'manual-paybill-QBJ7X9KD2', 'QBJ7X9KD2', 'Confirmed'),
    (demo_tenant, demo_candidate, 'Donation', '+254720222333', 50000, 'STK Push', 'JUKWAA-JOHNDOE-DON-002', 'ws_CO_160620261004', 'QBJ8A0KD3', 'Confirmed'),
    (demo_tenant, demo_candidate, 'Fundraising', '+254733444555', 18700, 'Paybill', 'JUKWAA-JOHNDOE-FUND-001', 'manual-paybill-FUND001', null, 'Pending');

  insert into public.predictive_snapshots (tenant_id, candidate_id, metric, estimate, label)
  values
    (demo_tenant, demo_candidate, 'Competitiveness', 64, 'Leaning competitive'),
    (demo_tenant, demo_candidate, 'Volunteer growth', 72, 'Healthy growth'),
    (demo_tenant, demo_candidate, 'Mobilization gap', 38, 'Needs attention');

  insert into public.scenario_plans (tenant_id, candidate_id, title, turnout_shift, volunteer_increase, additional_spend_kes, projected_impact, created_by)
  values
    (demo_tenant, demo_candidate, 'Higher turnout push', 8, 12, 85000, 'Improves turnout estimate in Umoja and Kijiji wards.', manager_member),
    (demo_tenant, demo_candidate, 'Volunteer surge', 3, 25, 45000, 'Improves coverage and undecided voter follow-up.', manager_member);

  insert into public.campaign_documents (tenant_id, candidate_id, title, category, file_path, version, permission, uploaded_by)
  values
    (demo_tenant, demo_candidate, 'Volunteer Training Manual', 'Training Material', '/documents/volunteer-training.pdf', 'v1.2', 'All Team', manager_member),
    (demo_tenant, demo_candidate, 'Campaign Budget Master', 'Budget', '/documents/campaign-budget.xlsx', 'v2.0', 'Managers', manager_member),
    (demo_tenant, demo_candidate, 'Polling Agent SOP', 'Result Form', '/documents/polling-agent-sop.pdf', 'v1.1', 'All Team', manager_member);

  insert into public.knowledge_articles (tenant_id, candidate_id, title, category, audience, body)
  values
    (demo_tenant, demo_candidate, 'How to register supporters offline', 'SOP', 'Volunteers', 'Capture supporter details offline and sync when connectivity returns.'),
    (demo_tenant, demo_candidate, 'Election day incident escalation', 'Campaign Manual', 'Polling Agents', 'Submit urgent incidents with GPS, photos, and severity.'),
    (demo_tenant, demo_candidate, 'Finance approval policy', 'FAQ', 'Managers', 'Expenses require receipt upload and campaign manager approval.');

  insert into public.push_notifications (tenant_id, candidate_id, title, body, notification_type, target_role)
  values
    (demo_tenant, demo_candidate, 'Event reminder', 'Community Grounds rally starts at 14:00.', 'Event Reminder', 'Volunteer'),
    (demo_tenant, demo_candidate, 'Incident alert', 'River Road Center requires immediate follow-up.', 'Incident Alert', 'Campaign Manager');

  insert into public.backup_runs (tenant_id, candidate_id, backup_type, status, storage_path, completed_at)
  values
    (demo_tenant, demo_candidate, 'Scheduled export', 'Completed', 'backups/demo-campaign/2026-06-18.zip', now());
end $$;
