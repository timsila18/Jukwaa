alter table public.communication_messages
  add column if not exists body text,
  add column if not exists recipient_phones jsonb not null default '[]'::jsonb,
  add column if not exists delivery_status text not null default 'Not Sent',
  add column if not exists provider_name text,
  add column if not exists provider_response jsonb,
  add column if not exists delivery_error text;

create index if not exists communication_messages_delivery_status_idx
  on public.communication_messages (tenant_id, candidate_id, delivery_status, created_at desc);
