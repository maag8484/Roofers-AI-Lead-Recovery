-- ============================================================================
-- 0015 UP — DROP the Twilio integration entirely.
--
-- ⚠️ DESTRUCTIVE. Removes public.twilio_accounts (provisioned-number records)
-- and its FK. Run ONLY if Twilio is dead everywhere — including n8n. If any n8n
-- workflow still writes provisioned numbers here, DO NOT run this.
--
-- The customer's own phone stays on roofing_companies.business_phone (that is a
-- different field, NOT Twilio) and is untouched.
--
-- Idempotent. Run in the Supabase SQL editor.
-- SQL-editor gotcha: clear the tab (Ctrl+A -> Delete) before pasting.
-- ============================================================================

-- Cascade drops the table's FK to auth.users, its index, and RLS policies.
drop table if exists public.twilio_accounts cascade;

-- ============================================================================
-- DONE. Verify (should return 0 rows):
--   select table_name from information_schema.tables
--   where table_schema = 'public' and table_name = 'twilio_accounts';
-- ============================================================================
