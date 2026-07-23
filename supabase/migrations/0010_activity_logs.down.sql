-- ============================================================================
-- 0010 DOWN — drop activity_logs (policies/indexes via cascade).
-- ============================================================================

drop table if exists public.activity_logs cascade;
