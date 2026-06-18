create type public.volunteer_status as enum ('Active', 'Inactive', 'Suspended', 'Pending Approval');
create type public.task_status as enum ('Pending', 'In Progress', 'Completed', 'Overdue');
create type public.task_type as enum ('Door-to-door campaign', 'Voter registration drive', 'Rally mobilization', 'Community meeting', 'Follow-up visits', 'Data collection');
create type public.priority_level as enum ('Low', 'Medium', 'High', 'Critical');
create type public.issue_status as enum ('Open', 'Under Review', 'Addressed');
create type public.event_type as enum ('Rally', 'Town Hall', 'Community Meeting', 'Fundraiser', 'Press Conference', 'Volunteer Training');
create type public.check_in_method as enum ('QR code', 'Manual check-in', 'Phone number lookup');
create type public.check_in_person_type as enum ('Volunteer', 'Supporter');
create type public.intelligence_category as enum ('Opponent Activity', 'Community Mood', 'Local Influencers', 'Emerging Issues', 'Campaign Opportunity', 'Security Concern', 'Political Risk');
create type public.issue_category as enum ('Roads', 'Water', 'Education', 'Healthcare', 'Agriculture', 'Youth Employment', 'Security', 'Electricity', 'Business', 'Environment', 'Other');
create type public.notification_status as enum ('Unread', 'Read', 'Archived');

create table public.volunteers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null,
  phone_number text not null,
  email citext,
  national_id text,
  gender text,
  age integer check (age is null or age >= 18),
  occupation text,
  county_id uuid references public.counties(id),
  constituency_id uuid references public.constituencies(id),
  ward_id uuid references public.wards(id),
  village_id uuid references public.villages(id),
  recruitment_source text,
  assigned_supervisor uuid references public.volunteers(id),
  status public.volunteer_status not null default 'Pending Approval',
  join_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, phone_number)
);

create table public.volunteer_tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  task_type public.task_type not null,
  title text not null,
  description text,
  assigned_to uuid not null references public.volunteers(id) on delete cascade,
  assigned_by uuid references auth.users(id),
  due_date date not null,
  status public.task_status not null default 'Pending',
  completion_notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.field_visits (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  volunteer_id uuid not null references public.volunteers(id) on delete cascade,
  visit_date date not null,
  start_time time not null,
  end_time time,
  village_id uuid references public.villages(id),
  polling_station_id uuid references public.polling_stations(id),
  visit_purpose text not null,
  supporters_engaged integer not null default 0 check (supporters_engaged >= 0),
  notes text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  captured_at timestamptz not null default now(),
  photos text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.intelligence_reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  category public.intelligence_category not null,
  location text,
  description text not null,
  urgency public.priority_level not null default 'Low',
  submitted_by uuid references public.volunteers(id),
  photos text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.community_issues (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  issue_title text not null,
  category public.issue_category not null,
  description text,
  ward_id uuid references public.wards(id),
  village_id uuid references public.villages(id),
  polling_station_id uuid references public.polling_stations(id),
  number_of_mentions integer not null default 1 check (number_of_mentions >= 0),
  priority_level public.priority_level not null default 'Low',
  status public.issue_status not null default 'Open',
  submitted_by uuid references public.volunteers(id),
  photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campaign_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  type public.event_type not null,
  venue text not null,
  event_date date not null,
  start_time time not null,
  end_time time,
  expected_attendance integer not null default 0 check (expected_attendance >= 0),
  organizer uuid references public.campaign_members(id),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_check_ins (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  event_id uuid not null references public.campaign_events(id) on delete cascade,
  person_type public.check_in_person_type not null,
  volunteer_id uuid references public.volunteers(id),
  supporter_id uuid references public.supporters(id),
  method public.check_in_method not null,
  phone_number text,
  ward_id uuid references public.wards(id),
  village_id uuid references public.villages(id),
  checked_in_by uuid references auth.users(id),
  checked_in_at timestamptz not null default now(),
  check (
    (person_type = 'Volunteer' and volunteer_id is not null)
    or (person_type = 'Supporter' and supporter_id is not null)
    or phone_number is not null
  )
);

create table public.internal_notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  recipient_user_id uuid references auth.users(id),
  recipient_volunteer_id uuid references public.volunteers(id),
  title text not null,
  body text not null,
  status public.notification_status not null default 'Unread',
  created_at timestamptz not null default now()
);

create index on public.volunteers (tenant_id, status);
create index on public.volunteers (tenant_id, ward_id, village_id);
create index on public.volunteer_tasks (tenant_id, assigned_to, status, due_date);
create index on public.field_visits (tenant_id, volunteer_id, visit_date desc);
create index on public.field_visits (tenant_id, polling_station_id);
create index on public.intelligence_reports (tenant_id, urgency, created_at desc);
create index on public.community_issues (tenant_id, status, priority_level);
create index on public.community_issues (tenant_id, ward_id, village_id);
create index on public.campaign_events (tenant_id, event_date);
create index on public.event_check_ins (tenant_id, event_id);
create index on public.internal_notifications (tenant_id, recipient_user_id, status, created_at desc);

create or replace function app_private.can_manage_area(
  required_tenant_id uuid,
  required_constituency_id uuid default null,
  required_ward_id uuid default null,
  required_village_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.campaign_members cm
    where cm.tenant_id = required_tenant_id
      and cm.user_id = auth.uid()
      and cm.status = 'Active'
      and (
        cm.role in ('Candidate', 'Campaign Manager', 'Admin')
        or (cm.role = 'Constituency Coordinator' and (cm.assigned_constituency_id is null or cm.assigned_constituency_id = required_constituency_id))
        or (cm.role = 'Ward Coordinator' and (cm.assigned_ward_id is null or cm.assigned_ward_id = required_ward_id))
        or (cm.role = 'Village Coordinator' and (cm.assigned_village_id is null or cm.assigned_village_id = required_village_id))
        or cm.role in ('Volunteer', 'Data Clerk')
      )
  );
$$;

grant execute on function app_private.can_manage_area(uuid, uuid, uuid, uuid) to authenticated;

alter table public.volunteers enable row level security;
alter table public.volunteer_tasks enable row level security;
alter table public.field_visits enable row level security;
alter table public.intelligence_reports enable row level security;
alter table public.community_issues enable row level security;
alter table public.campaign_events enable row level security;
alter table public.event_check_ins enable row level security;
alter table public.internal_notifications enable row level security;

create policy "members can read volunteers" on public.volunteers for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()));
create policy "coordinators can manage volunteers" on public.volunteers for all to authenticated
using (app_private.can_manage_area(tenant_id, constituency_id, ward_id, village_id))
with check (app_private.can_manage_area(tenant_id, constituency_id, ward_id, village_id));

create policy "members can read tasks" on public.volunteer_tasks for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()));
create policy "managers can assign tasks" on public.volunteer_tasks for insert to authenticated
with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Village Coordinator','Admin']::public.campaign_role[]));
create policy "assigned volunteers and managers can update tasks" on public.volunteer_tasks for update to authenticated
using (
  app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Village Coordinator','Admin']::public.campaign_role[])
  or assigned_to in (select id from public.volunteers where tenant_id in (select app_private.current_tenant_ids()))
)
with check (tenant_id in (select app_private.current_tenant_ids()));

create policy "members can read field visits" on public.field_visits for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()));
create policy "field teams can submit visits" on public.field_visits for insert to authenticated
with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Village Coordinator','Volunteer','Data Clerk','Admin']::public.campaign_role[]));
create policy "managers can update visits" on public.field_visits for update to authenticated
using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Village Coordinator','Admin']::public.campaign_role[]))
with check (tenant_id in (select app_private.current_tenant_ids()));

create policy "members can read intelligence" on public.intelligence_reports for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()));
create policy "field teams can submit intelligence" on public.intelligence_reports for insert to authenticated
with check (tenant_id in (select app_private.current_tenant_ids()));
create policy "managers can update intelligence" on public.intelligence_reports for update to authenticated
using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Admin']::public.campaign_role[]))
with check (tenant_id in (select app_private.current_tenant_ids()));

create policy "members can read issues" on public.community_issues for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()));
create policy "field teams can submit issues" on public.community_issues for insert to authenticated
with check (tenant_id in (select app_private.current_tenant_ids()));
create policy "coordinators can update issues" on public.community_issues for update to authenticated
using (app_private.can_manage_area(tenant_id, null, ward_id, village_id))
with check (tenant_id in (select app_private.current_tenant_ids()));

create policy "members can read events" on public.campaign_events for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()));
create policy "managers can manage events" on public.campaign_events for all to authenticated
using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Admin']::public.campaign_role[]))
with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Constituency Coordinator','Ward Coordinator','Admin']::public.campaign_role[]));

create policy "members can read checkins" on public.event_check_ins for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()));
create policy "event teams can create checkins" on public.event_check_ins for insert to authenticated
with check (tenant_id in (select app_private.current_tenant_ids()));

create policy "members can read notifications" on public.internal_notifications for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()));
create policy "members can update notifications" on public.internal_notifications for update to authenticated
using (tenant_id in (select app_private.current_tenant_ids()))
with check (tenant_id in (select app_private.current_tenant_ids()));
create policy "managers can create notifications" on public.internal_notifications for insert to authenticated
with check (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin']::public.campaign_role[]));

grant select, insert, update, delete on all tables in schema public to authenticated;

insert into storage.buckets (id, name, public)
values ('campaign-media', 'campaign-media', false)
on conflict (id) do nothing;

create policy "members can read campaign media"
on storage.objects for select to authenticated
using (
  bucket_id = 'campaign-media'
  and split_part(name, '/', 1)::uuid in (select app_private.current_tenant_ids())
);

create policy "members can upload campaign media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'campaign-media'
  and split_part(name, '/', 1)::uuid in (select app_private.current_tenant_ids())
);

create policy "members can update campaign media"
on storage.objects for update to authenticated
using (
  bucket_id = 'campaign-media'
  and split_part(name, '/', 1)::uuid in (select app_private.current_tenant_ids())
)
with check (
  bucket_id = 'campaign-media'
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
  station_town uuid;
  station_green uuid;
  station_community uuid;
  station_river uuid;
  vol_rose uuid;
  vol_kevin uuid;
  vol_lilian uuid;
  vol_moses uuid;
  manager_member uuid;
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
  select id into village_market from public.villages where tenant_id = demo_tenant and name = 'Market' limit 1;
  select id into village_hilltop from public.villages where tenant_id = demo_tenant and name = 'Hilltop' limit 1;
  select id into village_south from public.villages where tenant_id = demo_tenant and name = 'South' limit 1;
  select id into village_bridge from public.villages where tenant_id = demo_tenant and name = 'Bridge' limit 1;
  select id into station_town from public.polling_stations where tenant_id = demo_tenant and name = 'Town Hall A' limit 1;
  select id into station_green from public.polling_stations where tenant_id = demo_tenant and name = 'Green Primary' limit 1;
  select id into station_community from public.polling_stations where tenant_id = demo_tenant and name = 'Community Grounds' limit 1;
  select id into station_river from public.polling_stations where tenant_id = demo_tenant and name = 'River Road Center' limit 1;
  select id into manager_member from public.campaign_members where tenant_id = demo_tenant and email = 'manager@jukwaa.app' limit 1;

  insert into public.volunteers (tenant_id, full_name, phone_number, email, national_id, gender, age, occupation, county_id, constituency_id, ward_id, village_id, recruitment_source, status, join_date, notes)
  values
    (demo_tenant, 'Rose Volunteer', '+254711200001', 'rose@jukwaa.app', 'ID-1001', 'Female', 28, 'Community Organizer', demo_county, demo_constituency, ward_kijiji, village_market, 'Supporter referral', 'Active', '2026-05-20', 'Reliable door-to-door team lead.'),
    (demo_tenant, 'Kevin Mutiso', '+254711200002', 'kevin@jukwaa.app', 'ID-1002', 'Male', 32, 'Youth Coach', demo_county, demo_constituency, ward_mlimani, village_hilltop, 'Town hall', 'Active', '2026-05-22', 'Strong youth mobilizer.'),
    (demo_tenant, 'Lilian Akoth', '+254711200003', 'lilian@jukwaa.app', 'ID-1003', 'Female', 41, 'Trader', demo_county, demo_constituency, ward_umoja, village_south, 'Market outreach', 'Pending Approval', '2026-06-04', 'Awaiting ID verification.'),
    (demo_tenant, 'Moses Kariuki', '+254711200004', 'moses@jukwaa.app', 'ID-1004', 'Male', 37, 'Driver', demo_county, demo_constituency, ward_mto, village_bridge, 'Rally', 'Active', '2026-06-01', 'Available for event logistics.')
  on conflict (tenant_id, phone_number) do nothing;

  select id into vol_rose from public.volunteers where tenant_id = demo_tenant and phone_number = '+254711200001';
  select id into vol_kevin from public.volunteers where tenant_id = demo_tenant and phone_number = '+254711200002';
  select id into vol_lilian from public.volunteers where tenant_id = demo_tenant and phone_number = '+254711200003';
  select id into vol_moses from public.volunteers where tenant_id = demo_tenant and phone_number = '+254711200004';

  insert into public.volunteer_tasks (tenant_id, task_type, title, description, assigned_to, due_date, status, completion_notes)
  values
    (demo_tenant, 'Door-to-door campaign', 'Door-to-door campaign', 'Visit Market village households.', vol_rose, '2026-06-19', 'In Progress', '42 households reached so far.'),
    (demo_tenant, 'Voter registration drive', 'Voter registration drive', 'Identify unregistered youth near Green Primary.', vol_kevin, '2026-06-20', 'Pending', ''),
    (demo_tenant, 'Rally mobilization', 'Rally mobilization', 'Confirm attendance list for Community Grounds rally.', vol_moses, '2026-06-18', 'Completed', 'Three transport routes confirmed.'),
    (demo_tenant, 'Follow-up visits', 'Follow-up visits', 'Revisit undecided households logged last week.', vol_lilian, '2026-06-16', 'Overdue', 'Pending supervisor approval.');

  insert into public.field_visits (tenant_id, volunteer_id, visit_date, start_time, end_time, village_id, polling_station_id, visit_purpose, supporters_engaged, notes, latitude, longitude, photos)
  values
    (demo_tenant, vol_rose, '2026-06-18', '08:15', '09:05', village_market, station_town, 'Door-to-door campaign', 31, 'Road repairs came up repeatedly.', -1.2864, 36.8172, array['field/rose-market-1.jpg']),
    (demo_tenant, vol_kevin, '2026-06-18', '10:00', '10:45', village_hilltop, station_green, 'Voter registration drive', 24, 'Youth employment and sports funding concerns.', -1.2921, 36.8219, array['field/kevin-hilltop-1.jpg']),
    (demo_tenant, vol_moses, '2026-06-17', '15:20', '16:10', village_bridge, station_river, 'Rally mobilization', 18, 'Transport route agreed with village chair.', -1.2767, 36.8076, array['field/moses-bridge-1.jpg']);

  insert into public.community_issues (tenant_id, issue_title, category, description, ward_id, village_id, polling_station_id, number_of_mentions, priority_level, status, submitted_by)
  values
    (demo_tenant, 'Market road drainage', 'Roads', 'Stalls flood after heavy rain.', ward_kijiji, village_market, station_town, 38, 'High', 'Open', vol_rose),
    (demo_tenant, 'Clinic night shift staffing', 'Healthcare', 'Residents report limited night coverage.', ward_umoja, village_south, station_community, 24, 'Critical', 'Under Review', vol_lilian),
    (demo_tenant, 'Youth job placement', 'Youth Employment', 'Requests for apprenticeship links.', ward_mlimani, village_hilltop, station_green, 31, 'High', 'Open', vol_kevin);

  insert into public.intelligence_reports (tenant_id, title, category, location, description, urgency, submitted_by, photos)
  values
    (demo_tenant, 'Opponent team booking youth hall', 'Opponent Activity', 'Kijiji Ward', 'Rival mobilizers booked youth hall for Saturday.', 'Medium', vol_rose, array['intel/hall.jpg']),
    (demo_tenant, 'Security tension near bridge', 'Security Concern', 'Mto Bridge', 'Local leaders requested calmer messaging before rally.', 'High', vol_moses, array['intel/bridge.jpg']);

  insert into public.campaign_events (tenant_id, title, type, venue, event_date, start_time, end_time, expected_attendance, organizer, description)
  values
    (demo_tenant, 'Community Grounds Rally', 'Rally', 'Community Grounds', '2026-06-22', '14:00', '17:00', 1200, manager_member, 'Ward-wide mobilization rally.'),
    (demo_tenant, 'Kijiji Town Hall', 'Town Hall', 'Town Hall A', '2026-06-19', '18:00', '20:00', 220, manager_member, 'Issue listening session.');

  insert into public.internal_notifications (tenant_id, title, body)
  values
    (demo_tenant, 'New task assigned', 'Kevin Mutiso has a voter registration task due on 2026-06-20.'),
    (demo_tenant, 'Task overdue', 'Follow-up visits assigned to Lilian Akoth are overdue.');
end $$;
