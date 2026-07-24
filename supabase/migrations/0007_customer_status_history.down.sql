-- ============================================================================
-- 0007 DOWN — drop customer_status_history (and its policies/index via cascade).
-- ============================================================================

drop table if exists public.customer_status_history cascade;
