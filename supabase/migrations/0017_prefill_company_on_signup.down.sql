-- ============================================================================
-- Roof AI Lead Recovery — 0017 DOWN: undo pre-create-company-on-signup
-- ============================================================================
-- Removes the signup trigger + function. Does NOT delete the stub rows created
-- while it was active — dropping customer rows is destructive and the real
-- onboarding upsert may already have populated them. If you truly want to
-- remove only the never-onboarded stubs, do it deliberately and manually:
--
--   delete from public.roofing_companies
--   where details_submitted = false and company_name = '';
--
-- (Review the selection first — a stub is company_name = '' AND
-- details_submitted = false.)
-- ============================================================================

drop trigger if exists on_auth_user_created_company on auth.users;
drop function if exists public.handle_new_user_company();

-- ============================================================================
-- DONE.
-- ============================================================================
