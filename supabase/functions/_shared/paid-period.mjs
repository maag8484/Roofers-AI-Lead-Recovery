import {termsVersion} from './founding-card-pilot.mjs';

// Called only after Stripe signature verification. Re-fetch the invoice and
// subscription so an old event cannot open a period that is no longer current.
export async function recordPaidPeriod(invoiceId, {stripe, db, now = Date.now}) {
  const invoice = await stripe.invoices.retrieve(invoiceId, {expand:['payment_intent.latest_charge']});
  if (!invoice.livemode || invoice.status !== 'paid' || !invoice.paid ||
      typeof invoice.subscription !== 'string') return 'ignored';
  const sub = await stripe.subscriptions.retrieve(invoice.subscription);
  if (sub.metadata?.pilot_terms_version !== termsVersion) return 'legacy_ignored';
  const pi = invoice.payment_intent, charge = pi?.latest_charge;
  if (!sub.livemode || sub.status !== 'active' || sub.customer !== invoice.customer ||
      !pi || typeof pi === 'string' || !pi.livemode || pi.status !== 'succeeded' ||
      pi.customer !== invoice.customer || pi.currency !== 'usd' ||
      pi.amount_received !== invoice.amount_paid || invoice.amount_paid <= 0 ||
      !charge || typeof charge === 'string' || !charge.paid || !charge.captured ||
      charge.disputed || charge.amount_refunded !== 0) throw Error('Unsettled founding invoice');
  if (sub.latest_invoice !== invoice.id || !Number.isSafeInteger(sub.current_period_start) ||
      !Number.isSafeInteger(sub.current_period_end) || sub.current_period_start * 1000 > now() ||
      sub.current_period_end * 1000 <= now()) return 'historical_ignored';
  const {data:a,error} = await db.from('roof_founder_activations').select('*')
    .eq('reservation_id',sub.metadata.reservation).single();
  if (error || !a || !a.claimed_at || a.canceled_at || a.consent_version !== termsVersion ||
      a.user_id !== sub.metadata.supabase_user_id || a.customer_id !== sub.customer ||
      (a.stripe_subscription_id && a.stripe_subscription_id !== sub.id)) throw Error('Unbound founding invoice');
  const {data:c,error:ce} = await db.from('roofing_companies').select('user_id').eq('id',a.company_id).single();
  if (ce || c?.user_id !== a.user_id) throw Error('Founding company mismatch');
  const {error:write} = await db.from('roof_paid_periods').upsert({company_id:a.company_id,
    subscription_id:sub.id,starts_at:new Date(sub.current_period_start*1000).toISOString(),
    ends_at:new Date(sub.current_period_end*1000).toISOString()},
    {onConflict:'subscription_id,starts_at',ignoreDuplicates:true});
  if (write) throw write;
  return 'recorded';
}
