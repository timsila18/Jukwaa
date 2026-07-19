alter table public.communication_messages
  add column if not exists provider_message_ids jsonb not null default '[]'::jsonb,
  add column if not exists delivered_count integer not null default 0,
  add column if not exists failed_count integer not null default 0,
  add column if not exists last_delivery_report_at timestamptz;

create index if not exists communication_messages_provider_message_ids_idx
  on public.communication_messages using gin (provider_message_ids);
