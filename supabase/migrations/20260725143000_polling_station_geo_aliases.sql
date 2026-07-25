create or replace function public.jukwaa_geo_key(value text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    regexp_replace(lower(coalesce(value, '')), '\m(county|city)\M', '', 'g'),
    '[^a-z0-9]+',
    '',
    'g'
  )
$$;

