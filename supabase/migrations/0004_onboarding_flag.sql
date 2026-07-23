-- ============================================================================
-- Roof AI Lead Recovery — ONBOARDING COMPLETION FLAG
-- Run AFTER 0003_form_fields.sql, in the Supabase SQL editor. Idempotent.
--
-- Drives the first-login welcome/onboarding experience: the wizard auto-shows
-- while this is false, and is marked true once the customer finishes it (or
-- reaches Stripe checkout). Lives on `profiles` because that row exists at
-- login time — before any subscription or roofing_companies row.
--
-- Owners can already UPDATE their own profile (profiles_update_own from 0000),
-- so no new policy is needed for the app to flip this flag.
-- ============================================================================

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

-- ============================================================================
-- DONE. Verify:
--   select column_name from information_schema.columns
--   where table_name = 'profiles' and column_name = 'onboarding_completed';
-- ============================================================================
