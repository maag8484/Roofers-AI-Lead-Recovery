-- Audit requests expire independently of the deduplication ledger. Preserve
-- the call claim when an expired audit is removed by the existing cleanup job.
alter table public.vapi_signup_deliveries
 drop constraint vapi_signup_deliveries_audit_request_id_fkey,
 add constraint vapi_signup_deliveries_audit_request_id_fkey
 foreign key (audit_request_id) references public.audit_requests(id) on delete set null;
