-- ============================================================================
-- DANGER — WIPE ALL USERS
-- Run this ONCE in the Supabase SQL editor to clear every account before you
-- create your two fresh users (one customer, one admin).
--
-- Deleting from auth.users CASCADES to every app table (profiles,
-- roofing_companies, subscriptions, twilio_accounts, calendar_connections,
-- availability_settings, appointments, recovered_leads, status_history) via the
-- ON DELETE CASCADE foreign keys added in 0000_full_setup.sql / 0002_new_flow.sql.
--
-- It does NOT touch public.leads (the Outscraper scrape table owned by n8n) —
-- that table has no FK to auth.users. Leave it alone.
--
-- SQL-editor gotcha: this editor runs the WHOLE tab. Clear the editor
-- (Ctrl+A -> Delete) before pasting, so no stale SQL runs alongside this.
-- ============================================================================

-- Also clear the admins allow-list so no orphaned admin rows remain.
delete from public.admins;

-- Remove every auth user (cascades to all app tables).
delete from auth.users;

-- Verify (both should return 0):
--   select count(*) from auth.users;
--   select count(*) from public.roofing_companies;
