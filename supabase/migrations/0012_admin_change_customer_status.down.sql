-- ============================================================================
-- 0012 DOWN — drop the admin_change_customer_status RPC.
-- ============================================================================

drop function if exists public.admin_change_customer_status(uuid, public.customer_status_v2, text);
