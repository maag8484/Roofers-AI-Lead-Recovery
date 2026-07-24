-- ============================================================================
-- 0009 DOWN — drop admin_notifications (policies/index via cascade).
-- ============================================================================

drop table if exists public.admin_notifications cascade;
