-- ============================================================================
-- Rollback for 0019_smith_build_fields.up.sql
-- WARNING: drops the captured employee directory / provider data.
-- ============================================================================

alter table public.roofing_companies
  drop constraint if exists roofing_companies_employees_is_array;

alter table public.roofing_companies
  drop column if exists phone_provider,
  drop column if exists phone_provider_other,
  drop column if exists employees,
  drop column if exists summary_emails;
