create table public.political_parties (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  country_code text not null default 'KE',
  register_serial integer not null,
  name text not null,
  abbreviation text not null,
  display_name text generated always as (name || ' (' || abbreviation || ')') stored,
  featured_rank integer,
  source text not null default 'ORPP fully registered political parties, May 2026',
  created_at timestamptz not null default now()
);

create unique index political_parties_global_ke_serial_idx
on public.political_parties (country_code, register_serial)
where tenant_id is null;

create index political_parties_featured_idx
on public.political_parties (country_code, featured_rank nulls last, register_serial);

alter table public.political_parties enable row level security;

create policy "members can read global and tenant political parties"
on public.political_parties for select
to authenticated
using (tenant_id is null or tenant_id in (select app_private.current_tenant_ids()));

create policy "managers can manage tenant political parties"
on public.political_parties for all
to authenticated
using (tenant_id is not null and app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin']::public.campaign_role[]))
with check (tenant_id is not null and app_private.has_tenant_role(tenant_id, array['Candidate','Campaign Manager','Admin']::public.campaign_role[]));

grant select, insert, update, delete on public.political_parties to authenticated;

insert into public.political_parties (country_code, register_serial, name, abbreviation, featured_rank)
values
  ('KE', 13, 'United Democratic Alliance', 'UDA', 1),
  ('KE', 16, 'Orange Democratic Movement', 'ODM', 2),
  ('KE', 91, 'Democracy for the Citizens Party', 'DCP', 3),
  ('KE', 10, 'Wiper Patriotic Front', 'WPF', 4),
  ('KE', 73, 'Democratic Action Party-Kenya', 'DAP-K', 5),
  ('KE', 55, 'Maendeleo Chap Chap', 'MCCP', 6),
  ('KE', 22, 'National Rainbow Coalition', 'NARC', 7),
  ('KE', 1, 'People''s Liberation Party', 'PLP', null),
  ('KE', 2, 'The National Vision Party', 'NVP', null),
  ('KE', 3, 'Labour Party of Kenya', 'LPK', null),
  ('KE', 4, 'The Democratic Union', 'TDU', null),
  ('KE', 5, 'Party of Independent Candidate of Kenya', 'PICK', null),
  ('KE', 6, 'Devolution Empowerment Party', 'DEP', null),
  ('KE', 7, 'Kenya National Congress', 'KNC', null),
  ('KE', 8, 'Mazingira Green Party', 'MGP', null),
  ('KE', 9, 'Kenya Moja Movement Party', 'KMM', null),
  ('KE', 11, 'Democratic Party of Kenya', 'DP', null),
  ('KE', 12, 'Party of National Unity', 'PNU', null),
  ('KE', 14, 'Agano National Party', 'ANP', null),
  ('KE', 15, 'Kenya Social Congress', 'KSC', null),
  ('KE', 17, 'People''s Party of Kenya', 'PPK', null),
  ('KE', 18, 'Forum for Restoration of Democracy-Kenya', 'FORD-KENYA', null),
  ('KE', 19, 'Progressive Party of Kenya', 'PPOK', null),
  ('KE', 20, 'Jubilee Party', 'JP', null),
  ('KE', 21, 'Maendeleo Democratic Party', 'MDP', null),
  ('KE', 23, 'Kenya African Democratic Union-Asili', 'KADU-ASILI', null),
  ('KE', 24, 'Kenya Patriots Party', 'KPP', null),
  ('KE', 25, 'Communist Party of Kenya', 'CPK', null),
  ('KE', 26, 'Kenya African National Union', 'KANU', null),
  ('KE', 27, 'Safina Party', 'SAFINA', null),
  ('KE', 28, 'Chama Cha Uzalendo', 'CCU', null),
  ('KE', 29, 'National Agenda Party of Kenya', 'NAP-K', null),
  ('KE', 30, 'People''s Empowerment Party', 'PEP', null),
  ('KE', 31, 'Peoples Democratic Party', 'PDP', null),
  ('KE', 32, 'The New Democrats', 'TND', null),
  ('KE', 33, 'United Democratic Movement', 'UDM', null),
  ('KE', 34, 'Shirikisho Party of Kenya', 'SPK', null),
  ('KE', 35, 'Party of Democratic Unity', 'PDU', null),
  ('KE', 36, 'Umoja na Maendeleo Party', 'UMP', null),
  ('KE', 37, 'United Party of Independent Alliance', 'UPIA', null),
  ('KE', 38, 'Farmers Party', 'FP', null),
  ('KE', 39, 'Economic Freedom Party', 'EFP', null),
  ('KE', 40, 'Federal Party of Kenya', 'FPK', null),
  ('KE', 41, 'Muungano Party', 'MP', null),
  ('KE', 42, 'The National Party', 'TNP', null),
  ('KE', 43, 'Jirani Mzalendo Asili Party of Kenya', 'J-MAPK', null),
  ('KE', 44, 'Chama Cha Mashinani', 'CCM', null),
  ('KE', 45, 'Alliance for Change', 'AFC', null),
  ('KE', 46, 'Forum For Republican Democracy-Asili', 'FORD', null),
  ('KE', 47, 'Republican Liberty Party', 'RLP', null),
  ('KE', 48, 'Roots Party of Kenya', 'RPK', null),
  ('KE', 49, 'Ubuntu People''s Forum', 'UPF', null),
  ('KE', 50, 'Amani National Congress', 'ANC', null),
  ('KE', 51, 'Devolution Party of Kenya', 'DPK', null),
  ('KE', 52, 'United Democratic Party', 'UDP', null),
  ('KE', 53, 'Kenya Reform Party', 'KRP', null),
  ('KE', 54, 'People''s Trust Party', 'PTP', null),
  ('KE', 56, 'Democratic Congress', 'DC', null),
  ('KE', 57, 'Liberal Democratic Party', 'LDP', null),
  ('KE', 58, 'Green Congress of Kenya', 'GCK', null),
  ('KE', 59, 'National Liberal Party', 'NLP', null),
  ('KE', 60, 'Movement for Democracy and Growth', 'MDG', null),
  ('KE', 61, 'Alternative Leadership Party Of Kenya', 'ALP-K', null),
  ('KE', 62, 'Ukweli Party', 'UP', null),
  ('KE', 63, 'Empowerment and Liberation Party', 'ELP', null),
  ('KE', 64, 'Third Way Alliance Kenya', 'TAKE', null),
  ('KE', 65, 'Justice and Freedom Party of Kenya', 'JFP', null),
  ('KE', 66, 'Grand Dream Development Party', 'GDDP', null),
  ('KE', 67, 'United Green Movement', 'UGM', null),
  ('KE', 68, 'Usawa Kwa Wote', 'UKW', null),
  ('KE', 69, 'United Progressive Alliance', 'UPA', null),
  ('KE', 70, 'The Service Party', 'TSP', null),
  ('KE', 71, 'National Ordinary People Empowerment Union', 'NOPEU', null),
  ('KE', 72, 'National Reconstruction Alliance', 'NRA', null),
  ('KE', 74, 'Party for Peace and Development', 'PPD', null),
  ('KE', 75, 'Chama Cha Kazi', 'Kazi', null),
  ('KE', 76, 'Tujibebe Wakenya Party', 'JIBEBE', null),
  ('KE', 77, 'Kenya Union Party', 'KUP', null),
  ('KE', 78, 'Democratic National Alliance Party', 'DNA', null),
  ('KE', 79, 'Pamoja African Alliance', 'PAA', null),
  ('KE', 80, 'Mabadiliko Party of Kenya', 'MAPK', null),
  ('KE', 81, 'Entrust Pioneer Party', 'EPP', null),
  ('KE', 82, 'Party for Growth and Prosperity', 'PGP', null),
  ('KE', 83, 'Green Thinking Action Party', 'GTAP', null),
  ('KE', 84, 'National Democracy Expansion Party', 'NDEP', null),
  ('KE', 85, 'Unified Change Party', 'UCP', null),
  ('KE', 86, 'Universal Unity Party', 'UUP', null),
  ('KE', 87, 'Chama ya Mapatano of Kenya', 'CYMK', null),
  ('KE', 88, 'The Equitable Party', 'TEP', null),
  ('KE', 89, 'Azimio la Umoja One Kenya Coalition Party', 'Azimio', null),
  ('KE', 90, 'The We Alliance Party', 'TWAP', null),
  ('KE', 92, 'National Economic Development Party', 'NEDP', null),
  ('KE', 93, 'People''s Renaissance Movement', 'PM', null),
  ('KE', 94, 'Kenya United Generation Party', 'KUG', null),
  ('KE', 95, 'Peoples'' Forum for Rebuilding Democracy', 'PFRD', null),
  ('KE', 96, 'Msingi wa Utaifa', 'MUP', null)
on conflict do nothing;

update public.campaign_settings
set political_party = 'United Democratic Alliance (UDA)'
where tenant_id in (select id from public.tenants where slug = 'demo-campaign');
