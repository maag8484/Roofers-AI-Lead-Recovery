-- ============================================================================
-- 0013 DOWN — drop the admin_global_search RPC.
-- ============================================================================

drop function if exists public.admin_global_search(text, int);
