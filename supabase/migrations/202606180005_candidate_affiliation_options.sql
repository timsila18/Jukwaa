create or replace view public.candidate_affiliation_options
with (security_invoker = true)
as
select
  'independent-candidate'::text as id,
  'Independent Candidate'::text as display_name,
  'Independent'::text as affiliation_type,
  null::integer as register_serial,
  0::integer as sort_rank
union all
select
  'party-' || register_serial::text as id,
  display_name,
  'Registered Party'::text as affiliation_type,
  register_serial,
  coalesce(featured_rank, 1000 + register_serial) as sort_rank
from public.political_parties
where country_code = 'KE';

grant select on public.candidate_affiliation_options to authenticated;

update public.campaign_settings
set political_party = 'Independent Candidate'
where tenant_id in (select id from public.tenants where slug = 'demo-campaign');
