alter table public.volunteer_tasks
  add column if not exists assigned_member_id uuid references public.campaign_members(id) on delete set null,
  add column if not exists assigned_polling_agent_id uuid references public.polling_agents(id) on delete set null,
  add column if not exists assignee_type text not null default 'Volunteer',
  add column if not exists assignee_label text;

create index if not exists volunteer_tasks_assigned_member_idx
  on public.volunteer_tasks (tenant_id, candidate_id, assigned_member_id, status, due_date);

create index if not exists volunteer_tasks_assigned_polling_agent_idx
  on public.volunteer_tasks (tenant_id, candidate_id, assigned_polling_agent_id, status, due_date);

alter table public.communication_messages
  add column if not exists recipient_member_ids jsonb not null default '[]'::jsonb,
  add column if not exists meeting_url text,
  add column if not exists call_type text;

create index if not exists communication_messages_recipient_members_idx
  on public.communication_messages using gin (recipient_member_ids);
