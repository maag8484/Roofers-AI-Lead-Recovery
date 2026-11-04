import {founderContext, ownedSetup, consentCopy} from './founding-card-setup.mjs';
import {termsVersion} from './founding-card-pilot.mjs';

const hours = 3600000;
const reply = (status, body) => Response.json(body, {status});
function authorize(req, env, secret, gate) {
  if (req.method !== 'POST') return reply(405, {error:'method_not_allowed'});
  const key = env(secret);
  if (!key || key.length < 32 || req.headers.get('authorization') !== `Bearer ${key}`)
    return reply(403, {error:'forbidden'});
  if (env(gate) !== 'true') return reply(503, {error:'not_ready'});
}
function context(user) { try { return founderContext(user); } catch { return null; } }
function consentMatches(session) {
  const m = session?.metadata, si = session?.setup_intent?.metadata;
  return /^[a-f0-9-]{36}$/i.test(m?.consent_request ?? '') &&
    m.consent_text === consentCopy && si?.consent_request === m.consent_request &&
    si?.consent_text === consentCopy;
}
function customerMatches(customer, user, ctx, live) {
  return !customer.deleted && customer.livemode === live &&
    customer.metadata?.supabase_user_id === ctx.userId &&
    !!customer.email && customer.email.toLowerCase() === user.email?.toLowerCase();
}
export function validFounderPrice(plan, discount, live, customer, now) {
  const coupon = discount?.coupon;
  const product = typeof plan?.product === 'string' ? plan.product : plan?.product?.id;
  return plan?.active === true && plan.livemode === live && plan.currency === 'usd' &&
    plan.unit_amount === 29900 && plan.recurring?.interval === 'month' && plan.recurring.interval_count === 1 &&
    discount?.active === true && discount.livemode === live &&
    (!discount.customer || discount.customer === customer) &&
    (!discount.expires_at || discount.expires_at * 1000 > now) &&
    discount.restrictions?.first_time_transaction === true &&
    !discount.restrictions?.minimum_amount && coupon?.valid === true && coupon.livemode === live &&
    coupon.currency === 'usd' && coupon.amount_off === 10000 && coupon.duration === 'repeating' &&
    coupon.duration_in_months === 12 && coupon.max_redemptions === 10 &&
    Number.isInteger(coupon.times_redeemed) && coupon.times_redeemed < 10 &&
    (!coupon.redeem_by || coupon.redeem_by * 1000 > now) &&
    coupon.applies_to?.products?.includes(product);
}

// The database claim serializes cancellation against charging. Never clear or retry
// a claim after an uncertain Stripe request; reconcile it by reservation first.
export function createFounderBillingHandler({db, stripe, env, live, now = Date.now}) {
  return async req => {
    const denied = authorize(req, env, 'ROOF_FOUNDER_WORKER_SECRET', 'ROOF_FOUNDER_BILLING_READY');
    if (denied) return denied;
    const input = await req.json().catch(() => null), id = input?.reservation_id;
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(id)) return reply(400, {error:'invalid_reservation'});
    try {
      const {data:a,error} = await db.from('roof_founder_activations').select('*').eq('reservation_id',id).single();
      if (error || !a || a.consent_version !== termsVersion) return reply(409, {error:'ineligible_reservation'});
      if (a.canceled_at) return reply(200, {status:'canceled'});
      if (a.stripe_subscription_id) return reply(200, {status:'already_billed'});
      if (a.claimed_at) return reply(409, {error:'reconciliation_required'});
      const at = Date.parse(a.activated_at), time = now();
      if (!Number.isFinite(at)) return reply(409, {error:'invalid_activation'});
      if (time < at + 336 * hours) return reply(200, {status:'not_due'});
      if (time >= at + 337 * hours) return reply(409, {error:'manual_review_overdue'});
      const {data:u,error:ue} = await db.auth.admin.getUserById(a.user_id);
      const user = u?.user, ctx = context(user);
      if (ue || !ctx || ctx.customer !== a.customer_id || ctx.reservation !== id) return reply(409, {error:'owner_mismatch'});
      const session = await stripe.checkout.sessions.retrieve(a.setup_session_id,{expand:['setup_intent']});
      if (!ownedSetup(session,ctx,live) || !consentMatches(session) || !Number.isFinite(session.created) || session.created * 1000 > at)
        return reply(409, {error:'consent_not_verified'});
      const pm = await stripe.paymentMethods.retrieve(session.setup_intent.payment_method);
      const cust = await stripe.customers.retrieve(ctx.customer);
      if (pm.customer !== ctx.customer || pm.livemode !== live || !customerMatches(cust,user,ctx,live))
        return reply(409, {error:'payment_owner_mismatch'});
      if (!cust.address?.country || !cust.address?.postal_code)
        return reply(409, {error:'billing_address_required'});
      const prior = await stripe.subscriptions.list({customer:ctx.customer,status:'all',limit:1});
      if (prior.data.length) return reply(409, {error:'prior_subscription'});
      const price = live ? 'price_1TxyreCB5wADtZS1PSFxHja4' : env('ROOF_TEST_MONTHLY_PRICE');
      const promo = live ? 'promo_1UXlNRCB5wADtZS1pixAo3hy' : env('ROOF_TEST_FOUNDING_PROMO');
      if (!price || !promo) return reply(503, {error:'offer_not_configured'});
      const [plan,discount] = await Promise.all([stripe.prices.retrieve(price),stripe.promotionCodes.retrieve(promo)]);
      if (!validFounderPrice(plan,discount,live,ctx.customer,time)) return reply(409, {error:'offer_changed'});
      const {data:claim,error:ce} = await db.rpc('claim_due_roof_founder_trial',{p_reservation:id});
      if (ce || claim?.length !== 1) return reply(409, {error:'claim_not_acquired'});
      // Validate the locked row as well as the earlier read before crossing Stripe.
      for (const key of ['reservation_id','user_id','company_id','customer_id','setup_session_id','live_test_receipt','activated_at','consent_version'])
        if (claim[0][key] !== a[key]) return reply(409, {error:'reconciliation_required'});
      if (claim[0].canceled_at || claim[0].stripe_subscription_id || !claim[0].claimed_at) return reply(409, {error:'reconciliation_required'});
      const sub = await stripe.subscriptions.create({customer:ctx.customer,items:[{price}],collection_method:'charge_automatically',default_payment_method:pm.id,
        discounts:[{promotion_code:promo}],automatic_tax:{enabled:true},off_session:true,payment_behavior:'error_if_incomplete',
        metadata:{supabase_user_id:ctx.userId,pilot_terms_version:termsVersion,reservation:id}},
        {idempotencyKey:`roof-founder-first-paid:${id}`});
      if (!sub?.id || sub.customer !== ctx.customer || sub.livemode !== live) throw Error('Unverified subscription response');
      const saved = await db.from('roof_founder_activations').update({stripe_subscription_id:sub.id}).eq('reservation_id',id).select('reservation_id').single();
      if (saved.error || saved.data?.reservation_id !== id) throw Error('Reconcile claim');
      return reply(200, {status:sub.status});
    } catch { return reply(503, {error:'reconciliation_required'}); }
  };
}

// Trusted installation worker submits a verified live-test receipt. Signup or
// user-editable metadata never starts the pilot or permits a charge.
export function createFounderActivationHandler({db, stripe, env, live, now = Date.now}) {
  return async req => {
    const denied = authorize(req,env,'ROOF_FOUNDER_ACTIVATION_SECRET','ROOF_FOUNDER_ACTIVATION_READY');
    if (denied) return denied;
    const b = await req.json().catch(() => null), at = Date.parse(b?.live_test_at);
    if (!b || !Number.isFinite(at) || at > now() ||
        !/^[0-9a-f-]{36}$/i.test(b.company_id ?? '') || typeof b.receipt !== 'string' ||
        !b.receipt.trim() || b.receipt.length > 200 || !/^cs_(live|test)_[a-zA-Z0-9]+$/.test(b.setup_session ?? ''))
      return reply(400, {error:'invalid_activation'});
    try {
      const c = await db.from('roofing_companies').select('id,user_id,is_live,details_submitted').eq('id',b.company_id).single();
      if (c.error || !c.data?.is_live || !c.data.details_submitted) return reply(409, {error:'setup_incomplete'});
      const u = await db.auth.admin.getUserById(c.data.user_id), ctx = context(u.data?.user);
      if (u.error || !ctx) return reply(409, {error:'owner_ineligible'});
      const existing = await db.from('roof_founder_activations').select('*').eq('reservation_id',ctx.reservation).maybeSingle();
      if (existing.error) throw Error('Read failed');
      if (existing.data) {
        const a = existing.data;
        if (a.company_id !== c.data.id || a.user_id !== ctx.userId || a.customer_id !== ctx.customer ||
            a.setup_session_id !== b.setup_session || a.live_test_receipt !== b.receipt || Date.parse(a.activated_at) !== at || a.consent_version !== termsVersion)
          return reply(409, {error:'activation_conflict'});
        return reply(200, {status:a.canceled_at ? 'canceled' : 'already_recorded', activated_at:a.activated_at, first_charge_at:new Date(at + 336 * hours).toISOString()});
      }
      if (at < now() - 300000) return reply(400, {error:'stale_live_test'});
      const session = await stripe.checkout.sessions.retrieve(b.setup_session,{expand:['setup_intent']});
      if (!ownedSetup(session,ctx,live) || !consentMatches(session) || !Number.isFinite(session.created) || session.created * 1000 > at)
        return reply(409, {error:'consent_not_verified'});
      const customer = await stripe.customers.retrieve(ctx.customer);
      if (!customerMatches(customer,u.data.user,ctx,live)) return reply(409, {error:'customer_mismatch'});
      const result = await db.from('roof_founder_activations').insert({reservation_id:ctx.reservation,user_id:ctx.userId,company_id:c.data.id,customer_id:ctx.customer,
        setup_session_id:session.id,live_test_receipt:b.receipt,activated_at:new Date(at).toISOString(),consent_version:termsVersion});
      if (result.error) return reply(409, {error:'activation_conflict'});
      return reply(200, {status:'recorded', activated_at:new Date(at).toISOString(),first_charge_at:new Date(at + 336 * hours).toISOString()});
    } catch { return reply(503, {error:'activation_not_verified'}); }
  };
}
