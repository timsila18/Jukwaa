create table if not exists public.poll_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  template_name text not null,
  poll_type text not null default 'Issue Pulse',
  description text,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  title text not null,
  description text,
  poll_type text not null default 'Issue Pulse',
  status text not null default 'Draft' check (status in ('Draft','Scheduled','Active','Closed','Archived')),
  visibility text not null default 'Campaign Team' check (visibility in ('Private Draft','Campaign Team','Field Agents','Public Link')),
  start_date date,
  end_date date,
  target_response_count integer not null default 100 check (target_response_count >= 0),
  allow_anonymous boolean not null default true,
  require_consent boolean not null default true,
  collect_location boolean not null default true,
  collect_demographics boolean not null default true,
  methodology_note text,
  created_by_member_id uuid references public.campaign_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.poll_questions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  poll_id uuid not null references public.polls(id) on delete cascade,
  question_text text not null,
  question_type text not null default 'single_choice' check (question_type in ('single_choice','multiple_choice','text','rating','yes_no')),
  required boolean not null default true,
  display_order integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  question_id uuid not null references public.poll_questions(id) on delete cascade,
  option_text text not null,
  sentiment_score integer not null default 0,
  display_order integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_responses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  poll_id uuid not null references public.polls(id) on delete cascade,
  respondent_name text,
  phone_number text,
  phone_hash text,
  collection_method text not null default 'Field Agent',
  county_id uuid references public.counties(id) on delete set null,
  constituency_id uuid references public.constituencies(id) on delete set null,
  ward_id uuid references public.wards(id) on delete set null,
  village_id uuid references public.villages(id) on delete set null,
  polling_station_id uuid references public.polling_stations(id) on delete set null,
  age_group text,
  gender text,
  consent_to_process boolean not null default true,
  response_status text not null default 'Submitted' check (response_status in ('Draft','Submitted','Rejected')),
  response_metadata jsonb not null default '{}'::jsonb,
  submitted_by_member_id uuid references public.campaign_members(id) on delete set null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.poll_answers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  response_id uuid not null references public.poll_responses(id) on delete cascade,
  poll_id uuid not null references public.polls(id) on delete cascade,
  question_id uuid references public.poll_questions(id) on delete set null,
  option_id uuid references public.poll_options(id) on delete set null,
  text_answer text,
  numeric_answer numeric,
  ranking_value integer,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_action_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  poll_id uuid references public.polls(id) on delete set null,
  title text not null,
  description text,
  insight_category text not null default 'Issues',
  priority text not null default 'Medium' check (priority in ('Low','Medium','High','Critical')),
  status text not null default 'Open' check (status in ('Open','In Progress','Resolved','Archived')),
  assigned_team text,
  due_date date,
  county_id uuid references public.counties(id) on delete set null,
  constituency_id uuid references public.constituencies(id) on delete set null,
  ward_id uuid references public.wards(id) on delete set null,
  village_id uuid references public.villages(id) on delete set null,
  polling_station_id uuid references public.polling_stations(id) on delete set null,
  created_by_member_id uuid references public.campaign_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.poll_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  poll_id uuid references public.polls(id) on delete cascade,
  snapshot_label text not null,
  snapshot_data jsonb not null default '{}'::jsonb,
  methodology_note text,
  created_at timestamptz not null default now()
);

create index if not exists poll_templates_tenant_idx on public.poll_templates(tenant_id);
create index if not exists polls_tenant_status_idx on public.polls(tenant_id, status, created_at desc);
create index if not exists poll_questions_poll_idx on public.poll_questions(poll_id, display_order);
create index if not exists poll_options_question_idx on public.poll_options(question_id, display_order);
create index if not exists poll_responses_poll_area_idx on public.poll_responses(poll_id, county_id, constituency_id, ward_id, polling_station_id);
create index if not exists poll_answers_response_idx on public.poll_answers(response_id);
create index if not exists poll_action_items_tenant_status_idx on public.poll_action_items(tenant_id, status, priority);

create or replace function app_private.has_tenant_role(required_tenant_id uuid, allowed_roles text[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select app_private.has_tenant_role(required_tenant_id, allowed_roles::public.campaign_role[]);
$$;

grant execute on function app_private.has_tenant_role(uuid, text[]) to authenticated;

alter table public.poll_templates enable row level security;
alter table public.polls enable row level security;
alter table public.poll_questions enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_responses enable row level security;
alter table public.poll_answers enable row level security;
alter table public.poll_action_items enable row level security;
alter table public.poll_snapshots enable row level security;

drop policy if exists poll_templates_select on public.poll_templates;
create policy poll_templates_select on public.poll_templates for select to authenticated
using (tenant_id is null or app_private.is_platform_admin() or tenant_id in (select app_private.current_tenant_ids()));

drop policy if exists poll_templates_manage on public.poll_templates;
create policy poll_templates_manage on public.poll_templates for all to authenticated
using (app_private.is_platform_admin() or (tenant_id is not null and app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Data Clerk'])))
with check (app_private.is_platform_admin() or (tenant_id is not null and app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Data Clerk'])));

drop policy if exists polls_select on public.polls;
create policy polls_select on public.polls for select to authenticated
using (app_private.is_platform_admin() or tenant_id in (select app_private.current_tenant_ids()));

drop policy if exists polls_manage on public.polls;
create policy polls_manage on public.polls for all to authenticated
using (app_private.is_platform_admin() or app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Media Team','Data Clerk']))
with check (app_private.is_platform_admin() or app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Media Team','Data Clerk']));

drop policy if exists poll_questions_select on public.poll_questions;
create policy poll_questions_select on public.poll_questions for select to authenticated
using (app_private.is_platform_admin() or tenant_id in (select app_private.current_tenant_ids()));

drop policy if exists poll_questions_manage on public.poll_questions;
create policy poll_questions_manage on public.poll_questions for all to authenticated
using (app_private.is_platform_admin() or app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Media Team','Data Clerk']))
with check (app_private.is_platform_admin() or app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Media Team','Data Clerk']));

drop policy if exists poll_options_select on public.poll_options;
create policy poll_options_select on public.poll_options for select to authenticated
using (app_private.is_platform_admin() or tenant_id in (select app_private.current_tenant_ids()));

drop policy if exists poll_options_manage on public.poll_options;
create policy poll_options_manage on public.poll_options for all to authenticated
using (app_private.is_platform_admin() or app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Media Team','Data Clerk']))
with check (app_private.is_platform_admin() or app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Media Team','Data Clerk']));

drop policy if exists poll_responses_select on public.poll_responses;
create policy poll_responses_select on public.poll_responses for select to authenticated
using (app_private.is_platform_admin() or tenant_id in (select app_private.current_tenant_ids()));

drop policy if exists poll_responses_insert on public.poll_responses;
create policy poll_responses_insert on public.poll_responses for insert to authenticated
with check (app_private.is_platform_admin() or app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Village Coordinator','Volunteer','Polling Agent','Data Clerk','Admin']));

drop policy if exists poll_answers_select on public.poll_answers;
create policy poll_answers_select on public.poll_answers for select to authenticated
using (app_private.is_platform_admin() or tenant_id in (select app_private.current_tenant_ids()));

drop policy if exists poll_answers_insert on public.poll_answers;
create policy poll_answers_insert on public.poll_answers for insert to authenticated
with check (app_private.is_platform_admin() or app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Village Coordinator','Volunteer','Polling Agent','Data Clerk','Admin']));

drop policy if exists poll_action_items_select on public.poll_action_items;
create policy poll_action_items_select on public.poll_action_items for select to authenticated
using (app_private.is_platform_admin() or tenant_id in (select app_private.current_tenant_ids()));

drop policy if exists poll_action_items_manage on public.poll_action_items;
create policy poll_action_items_manage on public.poll_action_items for all to authenticated
using (app_private.is_platform_admin() or app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Admin','Data Clerk']))
with check (app_private.is_platform_admin() or app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Admin','Data Clerk']));

drop policy if exists poll_snapshots_select on public.poll_snapshots;
create policy poll_snapshots_select on public.poll_snapshots for select to authenticated
using (app_private.is_platform_admin() or tenant_id in (select app_private.current_tenant_ids()));

drop policy if exists poll_snapshots_manage on public.poll_snapshots;
create policy poll_snapshots_manage on public.poll_snapshots for all to authenticated
using (app_private.is_platform_admin() or app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Data Clerk']))
with check (app_private.is_platform_admin() or app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Data Clerk']));

insert into public.poll_templates (template_name, poll_type, description, questions)
values
  ('Ward Issue Pulse', 'Issue Pulse', 'Quick field poll for issue ranking by ward and polling station.', '[{"questionText":"What issue should the campaign prioritize first?","questionType":"single_choice","options":["Water","Roads","Healthcare","Jobs","Education","Security"]}]'::jsonb),
  ('Message Test', 'Message Test', 'Checks whether a campaign message is clear and persuasive.', '[{"questionText":"How persuasive is this message?","questionType":"rating","options":[]},{"questionText":"What should be improved?","questionType":"text","options":[]}]'::jsonb),
  ('Support Sentiment', 'Approval Pulse', 'Measures support movement and undecided concerns.', '[{"questionText":"How likely are you to support this candidate?","questionType":"single_choice","options":["Strongly support","Leaning support","Undecided","Leaning opponent","Oppose"]}]'::jsonb)
on conflict do nothing;
