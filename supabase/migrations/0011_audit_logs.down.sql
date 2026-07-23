-- ============================================================================
-- 0011 DOWN — drop audit_logs (policies/index via cascade).
-- ============================================================================

drop table if exists public.audit_logs cascade;
