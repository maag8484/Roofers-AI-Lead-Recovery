drop function if exists public.purge_expired_audit_requests();
drop function if exists public.submit_public_audit_request(jsonb, text, text, integer);
drop table if exists public.audit_requests;
