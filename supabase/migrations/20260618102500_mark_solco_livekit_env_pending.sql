update public.solco_integrations
set status = 'Needs Env',
    updated_at = now()
where status = 'Ready'
  and livekit_url_label = 'Reused from Solco LiveKit environment';
