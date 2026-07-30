-- Add cancellation tracking columns to subscriptions
alter table public.subscriptions
  add column if not exists cancel_reason text,
  add column if not exists canceled_at timestamptz,
  add column if not exists cancel_at_period_end boolean default false;
