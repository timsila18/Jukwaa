create extension if not exists pgcrypto;
create extension if not exists citext;

create schema if not exists app_private;

create type public.campaign_role as enum (
  'Candidate',
  'Campaign Manager',
  'Constituency Coordinator',
  'Ward Coordinator',
  'Village Coordinator',
  'Volunteer',
  'Polling Agent',
  'Media Team',
  'Data Clerk',
  'Admin'
);

create type public.support_level as enum (
  'Strong Supporter',
  'Leaning Supporter',
  'Undecided',
  'Opponent',
  'Unknown'
);

create type public.user_status as enum ('Invited', 'Active', 'Suspended');
create type public.interaction_type as enum ('Door-to-Door', 'Rally', 'Phone Call', 'SMS', 'WhatsApp', 'Meeting', 'Referral');
create type public.audit_action as enum ('Login', 'Logout', 'Create', 'Update', 'Delete', 'Export');

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.campaign_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  campaign_name text not null,
  candidate_name text not null,
  candidate_photo text,
  position_targeted text not null,
  political_party text,
  county text,
  constituency text,
  election_year integer,
  slogan text,
  logo text,
  primary_color text not null default '#0f766e',
  secondary_color text not null default '#0f172a',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campaign_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email citext not null,
  full_name text not null,
  role public.campaign_role not null,
  status public.user_status not null default 'Invited',
  assigned_country_id uuid,
  assigned_county_id uuid,
  assigned_constituency_id uuid,
  assigned_ward_id uuid,
  assigned_village_id uuid,
  assigned_polling_station_id uuid,
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (tenant_id, email),
  unique (tenant_id, user_id)
);

create table public.countries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  code text,
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table public.counties (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  country_id uuid not null references public.countries(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, country_id, name)
);

create table public.constituencies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  county_id uuid not null references public.counties(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, county_id, name)
);

create table public.wards (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  constituency_id uuid not null references public.constituencies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, constituency_id, name)
);

create table public.villages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  ward_id uuid not null references public.wards(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, ward_id, name)
);

create table public.polling_stations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  village_id uuid not null references public.villages(id) on delete cascade,
  name text not null,
  registered_voters integer not null default 0 check (registered_voters >= 0),
  created_at timestamptz not null default now(),
  unique (tenant_id, village_id, name)
);

create table public.supporters (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null,
  phone_number text not null,
  gender text,
  age_group text,
  occupation text,
  county_id uuid references public.counties(id),
  constituency_id uuid references public.constituencies(id),
  ward_id uuid references public.wards(id),
  village_id uuid references public.villages(id),
  polling_station_id uuid references public.polling_stations(id),
  support_level public.support_level not null default 'Unknown',
  key_issue text,
  volunteer_interest boolean not null default false,
  consent_to_contact boolean not null default false,
  notes text,
  registered_by uuid references auth.users(id),
  duplicate_override_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.supporter_interactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  supporter_id uuid not null references public.supporters(id) on delete cascade,
  interaction_type public.interaction_type not null,
  interaction_date date not null,
  notes text,
  next_follow_up_date date,
  officer_responsible uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id),
  action public.audit_action not null,
  module text not null,
  record_id text,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index on public.campaign_members (tenant_id, user_id, role, status);
create index on public.supporters (tenant_id, phone_number);
create index on public.supporters using gin (to_tsvector('simple', full_name));
create index on public.supporters (tenant_id, support_level);
create index on public.supporters (tenant_id, ward_id);
create index on public.supporter_interactions (tenant_id, supporter_id, interaction_date);
create index on public.audit_logs (tenant_id, created_at desc);

create or replace function app_private.current_tenant_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id
  from public.campaign_members
  where user_id = auth.uid()
    and status = 'Active';
$$;

create or replace function app_private.has_tenant_role(required_tenant_id uuid, allowed_roles public.campaign_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.campaign_members
    where tenant_id = required_tenant_id
      and user_id = auth.uid()
      and status = 'Active'
      and role = any(allowed_roles)
  );
$$;

grant usage on schema app_private to authenticated;
grant execute on function app_private.current_tenant_ids() to authenticated;
grant execute on function app_private.has_tenant_role(uuid, public.campaign_role[]) to authenticated;

alter table public.tenants enable row level security;
alter table public.campaign_settings enable row level security;
alter table public.campaign_members enable row level security;
alter table public.countries enable row level security;
alter table public.counties enable row level security;
alter table public.constituencies enable row level security;
alter table public.wards enable row level security;
alter table public.villages enable row level security;
alter table public.polling_stations enable row level security;
alter table public.supporters enable row level security;
alter table public.supporter_interactions enable row level security;
alter table public.audit_logs enable row level security;

create policy "members can read their tenants"
on public.tenants for select
to authenticated
using (id in (select app_private.current_tenant_ids()));

create policy "active members can read campaign settings"
on public.campaign_settings for select
to authenticated
using (tenant_id in (select app_private.current_tenant_ids()));

create policy "managers can manage campaign settings"
on public.campaign_settings for all
to authenticated
using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin']::public.campaign_role[]))
with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin']::public.campaign_role[]));

create policy "members can read campaign membership"
on public.campaign_members for select
to authenticated
using (tenant_id in (select app_private.current_tenant_ids()));

create policy "admins can manage campaign membership"
on public.campaign_members for all
to authenticated
using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin']::public.campaign_role[]))
with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin']::public.campaign_role[]));

create policy "members can read location hierarchy"
on public.countries for select to authenticated using (tenant_id in (select app_private.current_tenant_ids()));
create policy "members can read counties" on public.counties for select to authenticated using (tenant_id in (select app_private.current_tenant_ids()));
create policy "members can read constituencies" on public.constituencies for select to authenticated using (tenant_id in (select app_private.current_tenant_ids()));
create policy "members can read wards" on public.wards for select to authenticated using (tenant_id in (select app_private.current_tenant_ids()));
create policy "members can read villages" on public.villages for select to authenticated using (tenant_id in (select app_private.current_tenant_ids()));
create policy "members can read polling stations" on public.polling_stations for select to authenticated using (tenant_id in (select app_private.current_tenant_ids()));

create policy "location managers can write countries" on public.countries for all to authenticated using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Data Clerk']::public.campaign_role[])) with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Data Clerk']::public.campaign_role[]));
create policy "location managers can write counties" on public.counties for all to authenticated using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Data Clerk']::public.campaign_role[])) with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Data Clerk']::public.campaign_role[]));
create policy "location managers can write constituencies" on public.constituencies for all to authenticated using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Data Clerk']::public.campaign_role[])) with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Data Clerk']::public.campaign_role[]));
create policy "location managers can write wards" on public.wards for all to authenticated using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Data Clerk']::public.campaign_role[])) with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Data Clerk']::public.campaign_role[]));
create policy "location managers can write villages" on public.villages for all to authenticated using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Data Clerk']::public.campaign_role[])) with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Data Clerk']::public.campaign_role[]));
create policy "location managers can write polling stations" on public.polling_stations for all to authenticated using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Data Clerk']::public.campaign_role[])) with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin','Data Clerk']::public.campaign_role[]));

create policy "members can read supporters"
on public.supporters for select
to authenticated
using (tenant_id in (select app_private.current_tenant_ids()));

create policy "field teams can create supporters"
on public.supporters for insert
to authenticated
with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Village Coordinator','Volunteer','Data Clerk','Admin']::public.campaign_role[]));

create policy "field teams can update supporters"
on public.supporters for update
to authenticated
using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Village Coordinator','Data Clerk','Admin']::public.campaign_role[]))
with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Village Coordinator','Data Clerk','Admin']::public.campaign_role[]));

create policy "managers can delete supporters"
on public.supporters for delete
to authenticated
using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin']::public.campaign_role[]));

create policy "members can manage interactions"
on public.supporter_interactions for all
to authenticated
using (tenant_id in (select app_private.current_tenant_ids()))
with check (tenant_id in (select app_private.current_tenant_ids()));

create policy "members can read audit logs"
on public.audit_logs for select
to authenticated
using (tenant_id in (select app_private.current_tenant_ids()));

create policy "system can insert audit logs"
on public.audit_logs for insert
to authenticated
with check (tenant_id in (select app_private.current_tenant_ids()));

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;
