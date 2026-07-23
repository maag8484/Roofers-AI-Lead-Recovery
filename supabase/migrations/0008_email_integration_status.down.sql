-- ============================================================================
-- 0008 DOWN — drop email_integration_status (trigger/policy via cascade).
-- ============================================================================

drop table if exists public.email_integration_status cascade;
