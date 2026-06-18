create type public.agent_status as enum ('Assigned', 'Confirmed', 'Checked In', 'Active', 'Offline', 'Completed');
create type public.incident_category as enum ('Violence', 'Intimidation', 'Voter Suppression', 'Missing Materials', 'Delayed Opening', 'Agent Access Issues', 'Technology Failure', 'Security Incident', 'Other');
create type public.incident_status as enum ('Open', 'In Progress', 'Resolved');
create type public.election_form_type as enum ('Form 35', 'Form 36', 'Form 37', 'Form 38', 'Country-specific Equivalent');
create type public.verification_status as enum ('Pending', 'Verified', 'Rejected');
create type public.sync_status as enum ('Queued', 'Synced', 'Failed');

create table public.polling_agents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null,
  phone_number text not null,
  national_id text,
  assigned_county_id uuid references public.counties(id),
  assigned_constituency_id uuid references public.constituencies(id),
  assigned_ward_id uuid references public.wards(id),
  assigned_polling_station_id uuid references public.polling_stations(id),
  reporting_manager uuid references public.campaign_members(id),
  status public.agent_status not null default 'Assigned',
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, phone_number),
  unique (tenant_id, assigned_polling_station_id)
);

create table public.agent_check_ins (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  polling_agent_id uuid not null references public.polling_agents(id) on delete cascade,
  polling_station_id uuid not null references public.polling_stations(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  device_information jsonb not null default '{}'::jsonb
);

create table public.turnout_updates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  polling_station_id uuid not null references public.polling_stations(id) on delete cascade,
  reporting_time timestamptz not null,
  male_voters integer not null default 0 check (male_voters >= 0),
  female_voters integer not null default 0 check (female_voters >= 0),
  total_turnout integer generated always as (male_voters + female_voters) stored,
  turnout_percentage numeric(5, 2) not null default 0 check (turnout_percentage >= 0 and turnout_percentage <= 100),
  submitted_by uuid references public.polling_agents(id),
  created_at timestamptz not null default now(),
  unique (tenant_id, polling_station_id, reporting_time)
);

create table public.election_incidents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  category public.incident_category not null,
  description text not null,
  polling_station_id uuid references public.polling_stations(id),
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  photos text[] not null default '{}',
  videos text[] not null default '{}',
  urgency public.priority_level not null default 'Medium',
  submitted_by uuid references public.polling_agents(id),
  status public.incident_status not null default 'Open',
  assigned_to uuid references public.campaign_members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.election_forms (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  polling_station_id uuid not null references public.polling_stations(id) on delete cascade,
  form_type public.election_form_type not null,
  file_path text not null,
  file_mime_type text not null default 'application/pdf',
  uploaded_at timestamptz not null default now(),
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  uploaded_by uuid references public.polling_agents(id),
  duplicate_check_status text not null default 'Clear',
  missing_fields jsonb not null default '[]'::jsonb,
  quality_status public.verification_status not null default 'Pending',
  suspicious boolean not null default false,
  unique (tenant_id, polling_station_id, form_type, file_path)
);

create table public.polling_results (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  polling_station_id uuid not null references public.polling_stations(id) on delete cascade,
  candidate_name text not null,
  votes integer not null default 0 check (votes >= 0),
  rejected_votes integer not null default 0 check (rejected_votes >= 0),
  total_votes integer not null default 0 check (total_votes >= 0),
  uploaded_by uuid references public.polling_agents(id),
  verification_status public.verification_status not null default 'Pending',
  created_at timestamptz not null default now(),
  unique (tenant_id, polling_station_id, candidate_name)
);

create table public.election_alerts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  body text not null,
  alert_type text not null,
  severity public.priority_level not null default 'Medium',
  polling_station_id uuid references public.polling_stations(id),
  status public.notification_status not null default 'Unread',
  created_at timestamptz not null default now()
);

create table public.offline_submission_queue (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  module text not null,
  payload jsonb not null,
  sync_status public.sync_status not null default 'Queued',
  captured_at timestamptz not null default now(),
  synced_at timestamptz,
  submitted_by uuid references public.polling_agents(id)
);

create index on public.polling_agents (tenant_id, status, assigned_polling_station_id);
create index on public.agent_check_ins (tenant_id, polling_agent_id, checked_in_at desc);
create index on public.turnout_updates (tenant_id, polling_station_id, reporting_time desc);
create index on public.election_incidents (tenant_id, status, urgency, created_at desc);
create index on public.election_forms (tenant_id, quality_status, polling_station_id);
create index on public.polling_results (tenant_id, verification_status, polling_station_id);
create index on public.election_alerts (tenant_id, status, severity, created_at desc);
create index on public.offline_submission_queue (tenant_id, sync_status, captured_at desc);

alter table public.polling_agents enable row level security;
alter table public.agent_check_ins enable row level security;
alter table public.turnout_updates enable row level security;
alter table public.election_incidents enable row level security;
alter table public.election_forms enable row level security;
alter table public.polling_results enable row level security;
alter table public.election_alerts enable row level security;
alter table public.offline_submission_queue enable row level security;

create policy "members can read polling agents" on public.polling_agents for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()));
create policy "managers can manage polling agents" on public.polling_agents for all to authenticated
using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Admin']::public.campaign_role[]))
with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Admin']::public.campaign_role[]));

create policy "members can read agent checkins" on public.agent_check_ins for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()));
create policy "polling teams can submit checkins" on public.agent_check_ins for insert to authenticated
with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Polling Agent','Admin']::public.campaign_role[]));

create policy "members can read turnout updates" on public.turnout_updates for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()));
create policy "polling teams can submit turnout" on public.turnout_updates for insert to authenticated
with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Polling Agent','Data Clerk','Admin']::public.campaign_role[]));
create policy "managers can update turnout" on public.turnout_updates for update to authenticated
using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Admin']::public.campaign_role[]))
with check (tenant_id in (select app_private.current_tenant_ids()));

create policy "members can read election incidents" on public.election_incidents for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()));
create policy "polling teams can report incidents" on public.election_incidents for insert to authenticated
with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Polling Agent','Volunteer','Admin']::public.campaign_role[]));
create policy "managers can resolve incidents" on public.election_incidents for update to authenticated
using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Admin']::public.campaign_role[]))
with check (tenant_id in (select app_private.current_tenant_ids()));

create policy "members can read election forms" on public.election_forms for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()));
create policy "polling teams can upload election forms" on public.election_forms for insert to authenticated
with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Polling Agent','Data Clerk','Admin']::public.campaign_role[]));
create policy "managers can verify election forms" on public.election_forms for update to authenticated
using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Admin']::public.campaign_role[]))
with check (tenant_id in (select app_private.current_tenant_ids()));

create policy "members can read polling results" on public.polling_results for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()));
create policy "polling teams can submit results" on public.polling_results for insert to authenticated
with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Polling Agent','Data Clerk','Admin']::public.campaign_role[]));
create policy "managers can verify polling results" on public.polling_results for update to authenticated
using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Admin']::public.campaign_role[]))
with check (tenant_id in (select app_private.current_tenant_ids()));

create policy "members can read election alerts" on public.election_alerts for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()));
create policy "members can update election alerts" on public.election_alerts for update to authenticated
using (tenant_id in (select app_private.current_tenant_ids()))
with check (tenant_id in (select app_private.current_tenant_ids()));
create policy "managers can create election alerts" on public.election_alerts for insert to authenticated
with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Admin']::public.campaign_role[]));

create policy "members can read offline submissions" on public.offline_submission_queue for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()));
create policy "polling teams can queue offline submissions" on public.offline_submission_queue for insert to authenticated
with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Polling Agent','Volunteer','Data Clerk','Admin']::public.campaign_role[]));
create policy "managers can update offline submissions" on public.offline_submission_queue for update to authenticated
using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Admin']::public.campaign_role[]))
with check (tenant_id in (select app_private.current_tenant_ids()));

grant select, insert, update, delete on public.polling_agents to authenticated;
grant select, insert, update, delete on public.agent_check_ins to authenticated;
grant select, insert, update, delete on public.turnout_updates to authenticated;
grant select, insert, update, delete on public.election_incidents to authenticated;
grant select, insert, update, delete on public.election_forms to authenticated;
grant select, insert, update, delete on public.polling_results to authenticated;
grant select, insert, update, delete on public.election_alerts to authenticated;
grant select, insert, update, delete on public.offline_submission_queue to authenticated;

insert into storage.buckets (id, name, public)
values ('election-forms', 'election-forms', false)
on conflict (id) do nothing;

create policy "members can read election forms storage"
on storage.objects for select to authenticated
using (
  bucket_id = 'election-forms'
  and split_part(name, '/', 1)::uuid in (select app_private.current_tenant_ids())
);

create policy "members can upload election forms storage"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'election-forms'
  and split_part(name, '/', 1)::uuid in (select app_private.current_tenant_ids())
);

create policy "members can update election forms storage"
on storage.objects for update to authenticated
using (
  bucket_id = 'election-forms'
  and split_part(name, '/', 1)::uuid in (select app_private.current_tenant_ids())
)
with check (
  bucket_id = 'election-forms'
  and split_part(name, '/', 1)::uuid in (select app_private.current_tenant_ids())
);

do $$
declare
  demo_tenant uuid;
  demo_county uuid;
  demo_constituency uuid;
  ward_kijiji uuid;
  ward_mlimani uuid;
  ward_umoja uuid;
  ward_mto uuid;
  village_market uuid;
  village_hilltop uuid;
  village_south uuid;
  village_bridge uuid;
  village_north uuid;
  station_town_a uuid;
  station_town_b uuid;
  station_green uuid;
  station_river uuid;
  station_community uuid;
  station_faith uuid;
  manager_member uuid;
  data_member uuid;
  agent_sam uuid;
  agent_mercy uuid;
  agent_daniel uuid;
  agent_njeri uuid;
  agent_victor uuid;
  agent_faith uuid;
begin
  select id into demo_tenant from public.tenants where slug = 'demo-campaign';
  if demo_tenant is null then
    return;
  end if;

  select id into demo_county from public.counties where tenant_id = demo_tenant and name = 'Configurable County' limit 1;
  select id into demo_constituency from public.constituencies where tenant_id = demo_tenant and name = 'Central Constituency' limit 1;
  select id into ward_kijiji from public.wards where tenant_id = demo_tenant and name = 'Kijiji' limit 1;
  select id into ward_mlimani from public.wards where tenant_id = demo_tenant and name = 'Mlimani' limit 1;
  select id into ward_umoja from public.wards where tenant_id = demo_tenant and name = 'Umoja' limit 1;
  select id into ward_mto from public.wards where tenant_id = demo_tenant and name = 'Mto' limit 1;

  if ward_mto is null then
    insert into public.wards (tenant_id, constituency_id, name)
    values (demo_tenant, demo_constituency, 'Mto')
    on conflict (tenant_id, constituency_id, name) do nothing;
    select id into ward_mto from public.wards where tenant_id = demo_tenant and name = 'Mto' limit 1;
  end if;

  select id into village_market from public.villages where tenant_id = demo_tenant and name = 'Market' limit 1;
  select id into village_hilltop from public.villages where tenant_id = demo_tenant and name = 'Hilltop' limit 1;
  select id into village_south from public.villages where tenant_id = demo_tenant and name = 'South' limit 1;

  insert into public.villages (tenant_id, ward_id, name)
  values
    (demo_tenant, ward_mto, 'Bridge'),
    (demo_tenant, ward_umoja, 'North')
  on conflict (tenant_id, ward_id, name) do nothing;

  select id into village_bridge from public.villages where tenant_id = demo_tenant and name = 'Bridge' limit 1;
  select id into village_north from public.villages where tenant_id = demo_tenant and name = 'North' limit 1;

  insert into public.polling_stations (tenant_id, village_id, name, registered_voters)
  values
    (demo_tenant, village_market, 'Town Hall B', 1710),
    (demo_tenant, village_bridge, 'River Road Center', 2260),
    (demo_tenant, village_north, 'Faith Hall', 1420)
  on conflict (tenant_id, village_id, name) do nothing;

  select id into station_town_a from public.polling_stations where tenant_id = demo_tenant and name = 'Town Hall A' limit 1;
  select id into station_town_b from public.polling_stations where tenant_id = demo_tenant and name = 'Town Hall B' limit 1;
  select id into station_green from public.polling_stations where tenant_id = demo_tenant and name = 'Green Primary' limit 1;
  select id into station_river from public.polling_stations where tenant_id = demo_tenant and name = 'River Road Center' limit 1;
  select id into station_community from public.polling_stations where tenant_id = demo_tenant and name = 'Community Grounds' limit 1;
  select id into station_faith from public.polling_stations where tenant_id = demo_tenant and name = 'Faith Hall' limit 1;
  select id into manager_member from public.campaign_members where tenant_id = demo_tenant and email = 'manager@jukwaa.app' limit 1;
  select id into data_member from public.campaign_members where tenant_id = demo_tenant and email = 'data@jukwaa.app' limit 1;

  insert into public.polling_agents (tenant_id, full_name, phone_number, national_id, assigned_county_id, assigned_constituency_id, assigned_ward_id, assigned_polling_station_id, reporting_manager, status, last_seen_at)
  values
    (demo_tenant, 'Sam Polling', '+254722300001', 'ID-2001', demo_county, demo_constituency, ward_kijiji, station_town_a, manager_member, 'Active', '2027-08-09 15:05+03'),
    (demo_tenant, 'Mercy Adhiambo', '+254722300002', 'ID-2002', demo_county, demo_constituency, ward_kijiji, station_town_b, manager_member, 'Checked In', '2027-08-09 14:50+03'),
    (demo_tenant, 'Daniel Kipruto', '+254722300003', 'ID-2003', demo_county, demo_constituency, ward_mlimani, station_green, data_member, 'Active', '2027-08-09 15:11+03'),
    (demo_tenant, 'Njeri Kamau', '+254722300004', 'ID-2004', demo_county, demo_constituency, ward_mto, station_river, manager_member, 'Offline', '2027-08-09 12:30+03'),
    (demo_tenant, 'Victor Ouma', '+254722300005', 'ID-2005', demo_county, demo_constituency, ward_umoja, station_community, data_member, 'Completed', '2027-08-09 17:12+03'),
    (demo_tenant, 'Faith Chebet', '+254722300006', 'ID-2006', demo_county, demo_constituency, ward_umoja, station_faith, manager_member, 'Confirmed', '2027-08-09 08:02+03')
  on conflict (tenant_id, phone_number) do nothing;

  select id into agent_sam from public.polling_agents where tenant_id = demo_tenant and phone_number = '+254722300001';
  select id into agent_mercy from public.polling_agents where tenant_id = demo_tenant and phone_number = '+254722300002';
  select id into agent_daniel from public.polling_agents where tenant_id = demo_tenant and phone_number = '+254722300003';
  select id into agent_njeri from public.polling_agents where tenant_id = demo_tenant and phone_number = '+254722300004';
  select id into agent_victor from public.polling_agents where tenant_id = demo_tenant and phone_number = '+254722300005';
  select id into agent_faith from public.polling_agents where tenant_id = demo_tenant and phone_number = '+254722300006';

  insert into public.agent_check_ins (tenant_id, polling_agent_id, polling_station_id, checked_in_at, latitude, longitude, device_information)
  values
    (demo_tenant, agent_sam, station_town_a, '2027-08-09 05:58+03', -1.2864, 36.8172, '{"device":"Android","network":"Safaricom"}'),
    (demo_tenant, agent_mercy, station_town_b, '2027-08-09 06:04+03', -1.2867, 36.8175, '{"device":"Android","network":"Airtel"}'),
    (demo_tenant, agent_daniel, station_green, '2027-08-09 06:02+03', -1.2921, 36.8219, '{"device":"Android","network":"Safaricom"}'),
    (demo_tenant, agent_victor, station_community, '2027-08-09 05:55+03', -1.3012, 36.8293, '{"device":"Android","network":"Telkom"}');

  insert into public.turnout_updates (tenant_id, polling_station_id, reporting_time, male_voters, female_voters, turnout_percentage, submitted_by)
  values
    (demo_tenant, station_town_a, '2027-08-09 17:00+03', 702, 719, 77.23, agent_sam),
    (demo_tenant, station_town_b, '2027-08-09 17:00+03', 721, 740, 85.44, agent_mercy),
    (demo_tenant, station_green, '2027-08-09 17:00+03', 740, 761, 100.00, agent_daniel),
    (demo_tenant, station_river, '2027-08-09 17:00+03', 759, 782, 68.19, agent_njeri),
    (demo_tenant, station_community, '2027-08-09 17:00+03', 778, 803, 80.66, agent_victor),
    (demo_tenant, station_faith, '2027-08-09 17:00+03', 797, 824, 100.00, agent_faith)
  on conflict (tenant_id, polling_station_id, reporting_time) do nothing;

  insert into public.election_incidents (tenant_id, title, category, description, polling_station_id, latitude, longitude, photos, videos, urgency, submitted_by, status, assigned_to, created_at)
  values
    (demo_tenant, 'Agent denied desk access', 'Agent Access Issues', 'Presiding officer requested intervention before allowing party desk setup.', station_town_b, -1.2867, 36.8175, array['incidents/town-b-access.jpg'], '{}', 'High', agent_mercy, 'Resolved', manager_member, '2027-08-09 07:42+03'),
    (demo_tenant, 'Missing KIEMS backup battery', 'Technology Failure', 'Queue slowed after device power issue. Agent requested technical follow-up.', station_river, -1.2767, 36.8076, array['incidents/river-device.jpg'], array['incidents/river-device.mp4'], 'Critical', agent_njeri, 'In Progress', data_member, '2027-08-09 11:20+03'),
    (demo_tenant, 'Low turnout pocket', 'Voter Suppression', 'Elderly voters reported transport intimidation on bridge route.', station_faith, -1.2984, 36.8261, '{}', '{}', 'Medium', agent_faith, 'Open', manager_member, '2027-08-09 14:15+03');

  insert into public.election_forms (tenant_id, polling_station_id, form_type, file_path, uploaded_at, latitude, longitude, uploaded_by, duplicate_check_status, missing_fields, quality_status, suspicious)
  values
    (demo_tenant, station_town_a, 'Form 35', demo_tenant || '/town-hall-a/form-35.pdf', '2027-08-09 17:31+03', -1.2864, 36.8172, agent_sam, 'Clear', '[]', 'Verified', false),
    (demo_tenant, station_town_b, 'Form 35', demo_tenant || '/town-hall-b/form-35.pdf', '2027-08-09 17:44+03', -1.2867, 36.8175, agent_mercy, 'Clear', '["Deputy presiding officer signature"]', 'Pending', false),
    (demo_tenant, station_green, 'Form 35', demo_tenant || '/green-primary/form-35.pdf', '2027-08-09 17:52+03', -1.2921, 36.8219, agent_daniel, 'Clear', '[]', 'Verified', false),
    (demo_tenant, station_river, 'Form 35', demo_tenant || '/river-road/form-35.pdf', '2027-08-09 18:02+03', -1.2767, 36.8076, agent_njeri, 'Possible Duplicate', '["Stamped page"]', 'Rejected', true),
    (demo_tenant, station_community, 'Form 35', demo_tenant || '/community-grounds/form-35.pdf', '2027-08-09 17:58+03', -1.3012, 36.8293, agent_victor, 'Clear', '[]', 'Verified', false);

  insert into public.polling_results (tenant_id, polling_station_id, candidate_name, votes, rejected_votes, total_votes, uploaded_by, verification_status)
  values
    (demo_tenant, station_town_a, 'John Doe', 768, 18, 1421, agent_sam, 'Verified'),
    (demo_tenant, station_town_a, 'Main Opponent', 615, 18, 1421, agent_sam, 'Verified'),
    (demo_tenant, station_town_b, 'John Doe', 704, 16, 1338, agent_mercy, 'Pending'),
    (demo_tenant, station_town_b, 'Main Opponent', 618, 16, 1338, agent_mercy, 'Pending'),
    (demo_tenant, station_green, 'John Doe', 611, 12, 1117, agent_daniel, 'Verified'),
    (demo_tenant, station_green, 'Main Opponent', 494, 12, 1117, agent_daniel, 'Verified'),
    (demo_tenant, station_community, 'John Doe', 854, 22, 1608, agent_victor, 'Verified'),
    (demo_tenant, station_community, 'Main Opponent', 732, 22, 1608, agent_victor, 'Verified')
  on conflict (tenant_id, polling_station_id, candidate_name) do nothing;

  insert into public.election_alerts (tenant_id, title, body, alert_type, severity, polling_station_id, status, created_at)
  values
    (demo_tenant, 'Agent offline', 'River Road Center agent has not synced since 12:30.', 'Agent', 'Critical', station_river, 'Unread', '2027-08-09 15:00+03'),
    (demo_tenant, 'Low turnout', 'Faith Hall turnout trails supporter base and ward average.', 'Turnout', 'Medium', station_faith, 'Unread', '2027-08-09 15:15+03'),
    (demo_tenant, 'Form needs review', 'River Road Center form has duplicate and missing stamp flags.', 'Results', 'High', station_river, 'Read', '2027-08-09 18:05+03');

  insert into public.offline_submission_queue (tenant_id, module, payload, sync_status, captured_at, submitted_by)
  values
    (demo_tenant, 'turnout_updates', '{"pollingStation":"Faith Hall","interval":"17:00","male":797,"female":824}', 'Synced', '2027-08-09 17:03+03', agent_faith),
    (demo_tenant, 'election_incidents', '{"title":"Low turnout pocket","category":"Voter Suppression"}', 'Queued', '2027-08-09 14:12+03', agent_faith);
end $$;
