-- ============================================================================
-- Roof AI Lead Recovery — EXPANDED ONBOARDING FORM FIELDS
-- Run AFTER 0002_new_flow.sql, in the Supabase SQL editor. Idempotent.
--
-- Adds the remaining client-account fields captured by the /onboarding form:
--   * primary contact name + email
--   * warm-transfer number (used when conversion_preference = 'warm_transfer')
--   * hours of operation (live-handling window) + after-hours preferences
--
-- Existing columns reused as-is: company_name, address, business_phone,
-- service_areas, services, calendly_link, conversion_preference.
--
-- SQL-editor gotcha: this editor runs the WHOLE tab. Clear it (Ctrl+A -> Delete)
-- before pasting so no stale SQL runs alongside this.
-- ============================================================================

alter table public.roofing_companies
  add column if not exists contact_name           text,
  add column if not exists contact_email          text,
  add column if not exists transfer_number        text,   -- for warm_transfer
  add column if not exists business_hours          text,   -- when calls are handled live
  add column if not exists after_hours_preference  text;   -- voicemail / emergency line / etc.

-- ============================================================================
-- DONE. Verify:
--   select column_name from information_schema.columns
--   where table_name = 'roofing_companies' order by column_name;
--   -- should now also include: after_hours_preference, business_hours,
--   -- contact_email, contact_name, transfer_number
-- ============================================================================
