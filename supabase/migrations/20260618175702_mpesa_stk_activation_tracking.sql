alter table public.workspace_activation_payments
  add column if not exists checkout_request_id text,
  add column if not exists merchant_request_id text,
  add column if not exists raw_payload jsonb not null default '{}'::jsonb;

alter table public.workspace_activation_payments
  drop constraint if exists workspace_activation_payments_account_reference_key;

create index if not exists workspace_activation_payments_checkout_request_idx
  on public.workspace_activation_payments (checkout_request_id)
  where checkout_request_id is not null;

create unique index if not exists workspace_activation_payments_receipt_unique_idx
  on public.workspace_activation_payments (mpesa_receipt_number)
  where mpesa_receipt_number is not null;
