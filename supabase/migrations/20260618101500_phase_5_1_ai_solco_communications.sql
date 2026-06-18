create type public.communication_room_purpose as enum ('Command Briefing', 'Volunteer Coordination', 'Ward Town Hall', 'Candidate Broadcast');
create type public.communication_room_status as enum ('Scheduled', 'Live', 'Ended');
create type public.communication_channel as enum ('Solco Meeting', 'Campaign Chat', 'Broadcast SMS', 'WhatsApp');
create type public.communication_message_status as enum ('Draft', 'Queued', 'Sent', 'Delivered');
create type public.solco_integration_status as enum ('Ready', 'Needs Env');

create table public.solco_integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  workspace_url text not null default 'https://www.solco.co.ke',
  livekit_url_label text not null default 'Reused from Solco LiveKit environment',
  token_endpoint text not null default '/api/communications/livekit-token',
  meeting_path text not null default '/meeting/{roomName}',
  status public.solco_integration_status not null default 'Needs Env',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, candidate_id)
);

create table public.communication_rooms (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  title text not null,
  livekit_room_name text not null,
  purpose public.communication_room_purpose not null,
  status public.communication_room_status not null default 'Scheduled',
  audience text not null,
  scheduled_at timestamptz,
  host_member_id uuid references public.campaign_members(id) on delete set null,
  expected_participants integer not null default 0 check (expected_participants >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, candidate_id, livekit_room_name)
);

create table public.communication_participants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  room_id uuid not null references public.communication_rooms(id) on delete cascade,
  member_id uuid references public.campaign_members(id) on delete set null,
  display_name text not null,
  role text not null default 'attendee',
  joined_at timestamptz,
  left_at timestamptz,
  created_at timestamptz not null default now(),
  unique (room_id, display_name)
);

create table public.communication_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  channel public.communication_channel not null,
  subject text not null,
  sender_member_id uuid references public.campaign_members(id) on delete set null,
  audience text not null,
  status public.communication_message_status not null default 'Draft',
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, candidate_id, channel, subject)
);

create index on public.communication_rooms (tenant_id, candidate_id, status, scheduled_at);
create index on public.communication_participants (tenant_id, candidate_id, room_id);
create index on public.communication_messages (tenant_id, candidate_id, channel, status, sent_at desc);

alter table public.solco_integrations enable row level security;
alter table public.communication_rooms enable row level security;
alter table public.communication_participants enable row level security;
alter table public.communication_messages enable row level security;

create policy solco_integrations_select on public.solco_integrations
for select
using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

create policy solco_integrations_manage on public.solco_integrations
for all
using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin']::public.campaign_role[]) or app_private.is_platform_admin())
with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

create policy communication_rooms_select on public.communication_rooms
for select
using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

create policy communication_rooms_manage on public.communication_rooms
for all
using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Admin']::public.campaign_role[]) or app_private.is_platform_admin())
with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

create policy communication_participants_select on public.communication_participants
for select
using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

create policy communication_participants_manage on public.communication_participants
for all
using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin())
with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

create policy communication_messages_select on public.communication_messages
for select
using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

create policy communication_messages_manage on public.communication_messages
for all
using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Media Team','Constituency Coordinator','Ward Coordinator','Admin']::public.campaign_role[]) or app_private.is_platform_admin())
with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

do $$
declare
  tenant_row record;
  room_command uuid;
  manager_member uuid;
  candidate_member uuid;
begin
  for tenant_row in
    select c.tenant_id, c.id as candidate_id
    from public.candidates c
  loop
    select id into manager_member
    from public.campaign_members
    where tenant_id = tenant_row.tenant_id and candidate_id = tenant_row.candidate_id and role = 'Campaign Manager'
    limit 1;

    select id into candidate_member
    from public.campaign_members
    where tenant_id = tenant_row.tenant_id and candidate_id = tenant_row.candidate_id and role = 'Candidate'
    limit 1;

    insert into public.solco_integrations (tenant_id, candidate_id, workspace_url, status)
    values (tenant_row.tenant_id, tenant_row.candidate_id, 'https://www.solco.co.ke', 'Ready')
    on conflict (tenant_id, candidate_id) do update set
      workspace_url = excluded.workspace_url,
      status = excluded.status,
      updated_at = now();

    insert into public.communication_rooms (tenant_id, candidate_id, title, livekit_room_name, purpose, status, audience, scheduled_at, host_member_id, expected_participants)
    values
      (tenant_row.tenant_id, tenant_row.candidate_id, 'Daily Campaign Command Briefing', 'jukwaa-command-briefing', 'Command Briefing', 'Live', 'Candidate, campaign manager, coordinators', '2026-06-18 18:00+03', candidate_member, 18),
      (tenant_row.tenant_id, tenant_row.candidate_id, 'Umoja Ward Volunteer Coordination', 'jukwaa-umoja-volunteers', 'Volunteer Coordination', 'Scheduled', 'Ward coordinators and volunteers', '2026-06-19 07:30+03', manager_member, 42),
      (tenant_row.tenant_id, tenant_row.candidate_id, 'Kijiji Youth Town Hall', 'jukwaa-kijiji-townhall', 'Ward Town Hall', 'Scheduled', 'Youth leaders and community mobilizers', '2026-06-20 16:00+03', manager_member, 120)
    on conflict (tenant_id, candidate_id, livekit_room_name) do update set
      title = excluded.title,
      status = excluded.status,
      expected_participants = excluded.expected_participants,
      updated_at = now();

    select id into room_command
    from public.communication_rooms
    where tenant_id = tenant_row.tenant_id and candidate_id = tenant_row.candidate_id and livekit_room_name = 'jukwaa-command-briefing'
    limit 1;

    insert into public.communication_participants (tenant_id, candidate_id, room_id, member_id, display_name, role, joined_at)
    values
      (tenant_row.tenant_id, tenant_row.candidate_id, room_command, candidate_member, 'John Doe', 'host', '2026-06-18 18:01+03'),
      (tenant_row.tenant_id, tenant_row.candidate_id, room_command, manager_member, 'Mary Field', 'co_host', '2026-06-18 18:02+03')
    on conflict (room_id, display_name) do nothing;

    insert into public.communication_messages (tenant_id, candidate_id, channel, subject, sender_member_id, audience, status, sent_at)
    values
      (tenant_row.tenant_id, tenant_row.candidate_id, 'Solco Meeting', 'Command briefing link shared', manager_member, 'Core team', 'Delivered', '2026-06-18 17:42+03'),
      (tenant_row.tenant_id, tenant_row.candidate_id, 'Broadcast SMS', 'Volunteer reporting reminder', manager_member, 'Active volunteers', 'Sent', '2026-06-18 08:15+03'),
      (tenant_row.tenant_id, tenant_row.candidate_id, 'WhatsApp', 'Town hall mobilization kit', manager_member, 'Ward coordinators', 'Queued', '2026-06-18 20:00+03')
    on conflict (tenant_id, candidate_id, channel, subject) do update set
      status = excluded.status,
      sent_at = excluded.sent_at;
  end loop;
end $$;
