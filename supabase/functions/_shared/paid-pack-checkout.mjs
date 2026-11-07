import {currentPaidSettlement} from './current-paid-settlement.mjs';
import {termsVersion} from './founding-card-pilot.mjs';

const packs = {
  20: {price: 'price_1UXn65CB5wADtZS19CXdROLL', cents: 5000},
  50: {price: 'price_1UXn66CB5wADtZS12VbDpqYh', cents: 10000},
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// HTTP handler shared by the deployed entrypoint and boundary-isolated tests.
// Stable client request time makes expires_at identical on an uncertain retry.
// No credit is granted here: verified paid webhooks are the only fulfillment path.
export function createPackCheckoutHandler({getUser, db, stripe, mode, ready, json, handleOptions, now = Date.now}) {
  return async req => {
    const pre = handleOptions(req); if (pre) return pre;
    if (req.method !== 'POST') return json({error: 'Method not allowed'}, 405);
    if (mode !== 'live' || !ready) return json({error: 'Pack purchases unavailable'}, 503);
    const {user} = await getUser(req);
    if (!user) return json({error: 'Unauthorized'}, 401);
    const input = await req.json().catch(() => null);
    const sec = Math.floor(now() / 1000);
    if (!input || ![20, 50].includes(input.calls) || !uuid.test(input.request_id || '') ||
        !Number.isSafeInteger(input.requested_at) || input.requested_at > sec + 60 || input.requested_at < sec - 600) {
      return json({error: 'Choose a pack and start a fresh purchase request'}, 400);
    }
    try {
      const {data: company, error: ce} = await db.from('roofing_companies').select('id').eq('user_id', user.id).single();
      if (ce || !company) return json({error: 'Company unavailable'}, 403);
      const iso = new Date(sec * 1000).toISOString();
      const {data: period, error: pe} = await db.from('roof_paid_periods').select('*').eq('company_id', company.id)
        .lte('starts_at', iso).gt('ends_at', iso).single();
      if (pe || !period) return json({error: 'No verified paid period'}, 409);
      const sub = await stripe.subscriptions.retrieve(period.subscription_id, {expand: ['customer']});
      const customer = sub.customer;
      const end = Math.floor(Date.parse(period.ends_at) / 1000);
      if (!sub.livemode || sub.status !== 'active' || sub.metadata?.supabase_user_id !== user.id ||
          sub.metadata?.pilot_terms_version !== termsVersion ||
          sub.current_period_start !== Math.floor(Date.parse(period.starts_at) / 1000) ||
          sub.current_period_end !== end || end - sec < 1860 ||
          !customer || typeof customer === 'string' || customer.deleted || !customer.livemode ||
          customer.metadata?.supabase_user_id !== user.id || !user.email_confirmed_at ||
          !user.email || customer.email?.toLowerCase() !== user.email.toLowerCase()) {
        return json({error: 'No eligible paid period'}, 409);
      }
      if (!await currentPaidSettlement(sub, stripe)) return json({error: 'Current billing payment requires review'}, 409);
      const pack = packs[input.calls];
      const price = await stripe.prices.retrieve(pack.price);
      if (!price.active || !price.livemode || price.type !== 'one_time' || price.currency !== 'usd' ||
          price.unit_amount !== pack.cents) return json({error: 'Pack price unavailable'}, 503);
      const expires = Math.min(input.requested_at + 3600, end - 30);
      if (expires < sec + 1800) return json({error: 'Start a fresh purchase request'}, 409);
      const session = await stripe.checkout.sessions.create({
        mode: 'payment', customer: customer.id, payment_method_types: ['card'],
        line_items: [{price: pack.price, quantity: 1}], expires_at: expires,
        metadata: {purpose: 'roof_call_pack', period_id: period.id, company_id: company.id,
          pack_calls: String(input.calls), purchase_request: input.request_id},
        success_url: 'https://www.roofaileadrecovery.com/account?pack=processing',
        cancel_url: 'https://www.roofaileadrecovery.com/account?pack=canceled',
      }, {idempotencyKey: `roof-pack:${user.id}:${period.id}:${input.calls}:${input.request_id}`});
      if (!session.url || new URL(session.url).origin !== 'https://checkout.stripe.com') throw Error('No checkout URL');
      return json({url: session.url});
    } catch {
      return json({error: 'Checkout could not be confirmed. Retry this same request.'}, 503);
    }
  };
}
