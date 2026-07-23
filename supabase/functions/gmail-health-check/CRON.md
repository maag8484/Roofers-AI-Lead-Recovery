# Gmail health check — cron setup

`gmail-health-check` is deployed `--no-verify-jwt` so a scheduler can hit it. It
attempts a token refresh; on failure it flips the singleton to `NEEDS_REAUTH`,
writes a CRITICAL `admin_notification`, and stamps `last_health_check_at`. It
never sends mail and returns no secrets, so it is safe to expose.

Run it **every 5 minutes**. Pick ONE of the options below.

The function URL is:

```
https://<PROJECT_REF>.supabase.co/functions/v1/gmail-health-check
```

---

## Option A — External cron (simplest; no DB extensions)

Use cron-job.org, GitHub Actions, Vercel Cron, etc. Configure a **GET or POST**
every 5 minutes to the URL above. No auth header is required (JWT-off), but you
may send the anon key as an `apikey` header if your gateway requires one:

```
POST https://<PROJECT_REF>.supabase.co/functions/v1/gmail-health-check
Header: apikey: <SUPABASE_ANON_KEY>        # optional
Schedule: */5 * * * *
```

GitHub Actions example (`.github/workflows/gmail-health.yml`):

```yaml
name: gmail-health
on:
  schedule:
    - cron: "*/5 * * * *"
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsS -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/gmail-health-check"
```

---

## Option B — Supabase pg_cron + pg_net (in-database)

Requires the `pg_cron` and `pg_net` extensions enabled on your project
(Dashboard → Database → Extensions). Then run this ONCE in the SQL editor:

```sql
-- Enable extensions (no-op if already enabled).
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule an HTTP POST every 5 minutes.
select cron.schedule(
  'gmail-health-check',
  '*/5 * * * *',
  $$
    select net.http_post(
      url    := 'https://<PROJECT_REF>.supabase.co/functions/v1/gmail-health-check',
      headers:= '{"Content-Type": "application/json"}'::jsonb,
      body   := '{}'::jsonb
    );
  $$
);

-- To inspect or remove later:
--   select * from cron.job;
--   select cron.unschedule('gmail-health-check');
```

Replace `<PROJECT_REF>` with your project ref in all URLs.

---

## Note on the daily counter

`emails_sent_today` is incremented by `gmail-send` and is NOT reset by this
health check. The daily reset is a Phase 6 concern (a separate scheduled job or
a `date`-bucketed column). In Phase 5 the counter only backs the manual
`PHASE_5_DAILY_TEST_CAP = 20` button-safety guard.
