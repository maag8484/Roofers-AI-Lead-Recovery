-- Run after migration 0026. Both controls remain false until release QA passes.
-- Vault tokens must match their corresponding Edge Function environment secrets.
create extension if not exists pg_cron;
select cron.schedule('roof-billing-dispatch','*/5 * * * *',
  'select public.dispatch_roof_billing_jobs();');
-- Named schedule replaces that job rather than creating another sender.
-- Readback: select jobid,jobname,schedule,active from cron.job where jobname='roof-billing-dispatch';
