-- Public signup and payment writes now go through validated Next.js API routes.
-- Do not allow anonymous or ordinary authenticated clients to write directly
-- to commercial onboarding/payment tables through the Supabase Data API.

drop policy if exists candidate_onboarding_public_insert on public.candidate_onboarding_applications;
drop policy if exists activation_payments_public_insert on public.workspace_activation_payments;

revoke select, insert, update on public.candidate_onboarding_applications from anon;
revoke select, insert, update on public.workspace_activation_payments from anon;

revoke insert on public.candidate_onboarding_applications from authenticated;
revoke insert on public.workspace_activation_payments from authenticated;

-- Keep tenant/platform reads and platform updates available for authenticated
-- users under existing RLS policies. The application server continues to use
-- the service role for public onboarding/payment workflows.
grant select, update on public.candidate_onboarding_applications to authenticated;
grant select, update on public.workspace_activation_payments to authenticated;
