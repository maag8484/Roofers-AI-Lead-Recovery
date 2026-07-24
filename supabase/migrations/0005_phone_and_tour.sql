-- ============================================================================
-- Roof AI Lead Recovery — INTERNATIONAL PHONE + PRODUCT-TOUR FLAG
-- Run AFTER 0004_onboarding_flag.sql, in the Supabase SQL editor. Idempotent.
--
-- 1. business_phone now stores an E.164 number (e.g. +15551234567). We add
--    phone_country to keep the selected ISO country (e.g. "US", "IN") so the
--    phone input can re-hydrate the right flag/format.
-- 2. The customer-facing "Purchase Twilio number" / "Connect Google Calendar"
--    self-serve steps were removed from the UI (the team/n8n handle those now).
--    No columns are dropped — twilio_accounts / calendar_connections stay for
--    the admin panel + n8n. This migration is additive only.
--
-- Product-tour completion is already tracked by profiles.onboarding_completed
-- (added in 0004); we reuse it as the tour flag rather than adding a duplicate.
--
-- SQL-editor gotcha: this editor runs the WHOLE tab. Clear it (Ctrl+A -> Delete)
-- before pasting so no stale SQL runs alongside this.
-- ============================================================================

alter table public.roofing_companies
  add column if not exists phone_country text;   -- ISO 3166-1 alpha-2, e.g. "US"

-- ============================================================================
-- DONE. Verify:
--   select column_name from information_schema.columns
--   where table_name = 'roofing_companies' and column_name = 'phone_country';
-- ============================================================================
