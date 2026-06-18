do $$
declare
  demo_tenant uuid;
  demo_country uuid;
  demo_county uuid;
  demo_constituency uuid;
  ward_kijiji uuid;
  ward_mlimani uuid;
  ward_umoja uuid;
  village_market uuid;
  village_hilltop uuid;
  village_south uuid;
  station_town uuid;
  station_green uuid;
  station_community uuid;
begin
  insert into public.tenants (name, slug, is_demo)
  values ('Demo Campaign', 'demo-campaign', true)
  on conflict (slug) do update set name = excluded.name
  returning id into demo_tenant;

  insert into public.campaign_settings (
    tenant_id,
    campaign_name,
    candidate_name,
    position_targeted,
    political_party,
    county,
    constituency,
    election_year,
    slogan,
    primary_color,
    secondary_color
  )
  values (
    demo_tenant,
    'Demo Campaign',
    'John Doe',
    'MP',
    'Independent',
    'Configurable County',
    'Central Constituency',
    2027,
    'Service, dignity, delivery',
    '#0f766e',
    '#0f172a'
  );

  insert into public.countries (tenant_id, name, code)
  values (demo_tenant, 'Demo Country', 'DC')
  returning id into demo_country;

  insert into public.counties (tenant_id, country_id, name)
  values (demo_tenant, demo_country, 'Configurable County')
  returning id into demo_county;

  insert into public.constituencies (tenant_id, county_id, name)
  values (demo_tenant, demo_county, 'Central Constituency')
  returning id into demo_constituency;

  insert into public.wards (tenant_id, constituency_id, name) values
    (demo_tenant, demo_constituency, 'Kijiji') returning id into ward_kijiji;
  insert into public.wards (tenant_id, constituency_id, name)
    values (demo_tenant, demo_constituency, 'Mlimani') returning id into ward_mlimani;
  insert into public.wards (tenant_id, constituency_id, name)
    values (demo_tenant, demo_constituency, 'Umoja') returning id into ward_umoja;

  insert into public.villages (tenant_id, ward_id, name) values
    (demo_tenant, ward_kijiji, 'Market') returning id into village_market;
  insert into public.villages (tenant_id, ward_id, name)
    values (demo_tenant, ward_mlimani, 'Hilltop') returning id into village_hilltop;
  insert into public.villages (tenant_id, ward_id, name)
    values (demo_tenant, ward_umoja, 'South') returning id into village_south;

  insert into public.polling_stations (tenant_id, village_id, name, registered_voters)
    values (demo_tenant, village_market, 'Town Hall A', 1840) returning id into station_town;
  insert into public.polling_stations (tenant_id, village_id, name, registered_voters)
    values (demo_tenant, village_hilltop, 'Green Primary', 1320) returning id into station_green;
  insert into public.polling_stations (tenant_id, village_id, name, registered_voters)
    values (demo_tenant, village_south, 'Community Grounds', 1960) returning id into station_community;

  insert into public.campaign_members (tenant_id, email, full_name, role, status)
  values
    (demo_tenant, 'candidate@jukwaa.app', 'John Doe', 'Candidate', 'Active'),
    (demo_tenant, 'manager@jukwaa.app', 'Mary Field', 'Campaign Manager', 'Active'),
    (demo_tenant, 'data@jukwaa.app', 'Peter Data', 'Data Clerk', 'Active'),
    (demo_tenant, 'volunteer@jukwaa.app', 'Rose Volunteer', 'Volunteer', 'Invited');

  insert into public.supporters (
    tenant_id,
    full_name,
    phone_number,
    gender,
    age_group,
    occupation,
    county_id,
    constituency_id,
    ward_id,
    village_id,
    polling_station_id,
    support_level,
    key_issue,
    volunteer_interest,
    consent_to_contact,
    notes
  )
  values
    (demo_tenant, 'Amina Wanjiru', '+254710000000', 'Female', '25-34', 'Teacher', demo_county, demo_constituency, ward_kijiji, village_market, station_town, 'Strong Supporter', 'Education', true, true, 'Demo data removable by deleting demo tenant.'),
    (demo_tenant, 'Brian Otieno', '+254710000731', 'Male', '35-44', 'Mechanic', demo_county, demo_constituency, ward_mlimani, village_hilltop, station_green, 'Undecided', 'Jobs', false, true, 'Needs follow-up.'),
    (demo_tenant, 'Catherine Achieng', '+254710001462', 'Female', '45-59', 'Trader', demo_county, demo_constituency, ward_umoja, village_south, station_community, 'Leaning Supporter', 'Healthcare', true, true, 'Met at market outreach.');

  insert into public.supporter_interactions (tenant_id, supporter_id, interaction_type, interaction_date, notes, next_follow_up_date)
  select demo_tenant, id, 'Door-to-Door', current_date, 'Initial demo interaction.', current_date + 7
  from public.supporters
  where tenant_id = demo_tenant;
end $$;

-- Remove demo data with:
-- delete from public.tenants where slug = 'demo-campaign' and is_demo = true;
