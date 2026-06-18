create table if not exists public.api_rate_limits (
  id uuid primary key default gen_random_uuid(),
  rate_key text not null,
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  blocked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rate_key, window_start)
);

create table if not exists public.password_reset_codes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  candidate_id uuid references public.candidates(id) on delete cascade,
  member_id uuid references public.campaign_members(id) on delete cascade,
  login_identifier text not null,
  reset_code_hash text not null,
  status text not null default 'Pending' check (status in ('Pending', 'Used', 'Expired', 'Revoked')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.file_upload_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid references public.candidates(id) on delete cascade,
  uploaded_by uuid references public.campaign_members(id) on delete set null,
  bucket text not null default 'campaign-files',
  object_path text not null,
  file_name text not null,
  file_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  purpose text not null default 'Campaign Document',
  status text not null default 'Registered' check (status in ('Registered', 'Uploaded', 'Rejected', 'Deleted')),
  created_at timestamptz not null default now(),
  unique (bucket, object_path)
);

create index if not exists api_rate_limits_key_window_idx on public.api_rate_limits (rate_key, window_start desc);
create index if not exists password_reset_codes_lookup_idx on public.password_reset_codes (login_identifier, status, expires_at desc);
create index if not exists file_upload_records_workspace_idx on public.file_upload_records (tenant_id, candidate_id, created_at desc);

alter table public.api_rate_limits enable row level security;
alter table public.password_reset_codes enable row level security;
alter table public.file_upload_records enable row level security;

drop policy if exists "platform can read rate limits" on public.api_rate_limits;
create policy "platform can read rate limits" on public.api_rate_limits
for select to authenticated
using (app_private.is_platform_admin());

drop policy if exists "members can read own reset codes" on public.password_reset_codes;
create policy "members can read own reset codes" on public.password_reset_codes
for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

drop policy if exists "platform can manage reset codes" on public.password_reset_codes;
create policy "platform can manage reset codes" on public.password_reset_codes
for all to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

drop policy if exists "members can read upload records" on public.file_upload_records;
create policy "members can read upload records" on public.file_upload_records
for select to authenticated
using (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

drop policy if exists "members can create upload records" on public.file_upload_records;
create policy "members can create upload records" on public.file_upload_records
for insert to authenticated
with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

drop policy if exists "managers can update upload records" on public.file_upload_records;
create policy "managers can update upload records" on public.file_upload_records
for update to authenticated
using (app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Data Clerk','Admin']::public.campaign_role[]) or app_private.is_platform_admin())
with check (tenant_id in (select app_private.current_tenant_ids()) or app_private.is_platform_admin());

grant select, insert, update on public.api_rate_limits to authenticated;
grant select, insert, update on public.password_reset_codes to authenticated;
grant select, insert, update, delete on public.file_upload_records to authenticated;
