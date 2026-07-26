create table if not exists public.platform_client_outreach (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  seat text not null,
  contact text,
  phone_number text,
  status text not null default 'New',
  demo_date date,
  outcome text,
  next_follow_up date,
  notes text,
  owner_email citext not null default 'admin@jukwaakenya.co.ke',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('New', 'Contacted', 'Follow-up', 'Demo booked', 'Demo done', 'Converted', 'Not interested'))
);

create index if not exists platform_client_outreach_status_idx on public.platform_client_outreach (status, next_follow_up, demo_date);
create index if not exists platform_client_outreach_owner_idx on public.platform_client_outreach (owner_email, created_at desc);

alter table public.platform_client_outreach enable row level security;

drop policy if exists "platform admin can manage client outreach" on public.platform_client_outreach;
create policy "platform admin can manage client outreach"
on public.platform_client_outreach
for all
to authenticated
using (app_private.is_platform_admin() and lower(owner_email::text) = 'admin@jukwaakenya.co.ke')
with check (app_private.is_platform_admin() and lower(owner_email::text) = 'admin@jukwaakenya.co.ke');

grant select, insert, update, delete on public.platform_client_outreach to authenticated;
