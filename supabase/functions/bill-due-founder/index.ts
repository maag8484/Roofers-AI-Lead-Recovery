import {serviceClient} from '../_shared/supabase.ts';
import {stripe,STRIPE_MODE} from '../_shared/stripe.ts';
import {founderContext,ownedSetup} from '../_shared/founding-card-setup.mjs';
import {termsVersion} from '../_shared/founding-card-pilot.mjs';

// Internal due-job only. Reservation, offer, customer and setup session are
// bound on the server. A failed/uncertain attempt stays claimed for review.
Deno.serve(async req=>{
 if(req.method!=='POST')return new Response(null,{status:405});
 const key=Deno.env.get('ROOF_FOUNDER_WORKER_SECRET');
 if(!key||key.length<32||req.headers.get('authorization')!=='Bearer '+key)return new Response(null,{status:403});
 if(Deno.env.get('ROOF_FOUNDER_BILLING_READY')!=='true')return new Response(null,{status:503});
 const {reservation_id:id}=await req.json().catch(()=>({}));
 if(typeof id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(id))return new Response(null,{status:400});
 const db=serviceClient(),live=STRIPE_MODE==='live';
 try{
  const {data:a,error}=await db.from('roof_founder_activations').select('*').eq('reservation_id',id).single();
  if(error||!a||a.canceled_at||a.claimed_at||a.stripe_subscription_id||a.consent_version!==termsVersion)return new Response(null,{status:409});
  const {data:u,error:ue}=await db.auth.admin.getUserById(a.user_id);
  if(ue||!u.user)return new Response(null,{status:409});
  const ctx=founderContext(u.user);
  if(ctx.customer!==a.customer_id||ctx.reservation!==id)return new Response(null,{status:409});
  const session=await stripe.checkout.sessions.retrieve(a.setup_session_id,{expand:['setup_intent']});
  if(!ownedSetup(session,ctx,live)||session.created*1000>Date.parse(a.activated_at))return new Response(null,{status:409});
  const intent=session.setup_intent as any;
  const pm=await stripe.paymentMethods.retrieve(intent.payment_method);
  const cust=await stripe.customers.retrieve(ctx.customer);
  if(pm.customer!==ctx.customer||cust.deleted||cust.metadata.supabase_user_id!==ctx.userId||
   !cust.email||cust.email.toLowerCase()!==u.user.email?.toLowerCase())return new Response(null,{status:409});
  const prior=await stripe.subscriptions.list({customer:ctx.customer,status:'all',limit:1});
  if(prior.data.length)return new Response(null,{status:409});
  const price=live?'price_1TxyreCB5wADtZS1PSFxHja4':Deno.env.get('ROOF_TEST_MONTHLY_PRICE');
  const promo=live?'promo_1UXlNRCB5wADtZS1pixAo3hy':Deno.env.get('ROOF_TEST_FOUNDING_PROMO');
  if(!price||!promo)return new Response(null,{status:503});
  const [plan,discount]=await Promise.all([stripe.prices.retrieve(price),stripe.promotionCodes.retrieve(promo)]);
  const coupon=discount.coupon;
  if(!plan.active||plan.livemode!==live||plan.currency!=='usd'||plan.unit_amount!==29900||plan.recurring?.interval!=='month'||plan.recurring?.interval_count!==1||
   !discount.active||!discount.restrictions.first_time_transaction||!coupon.valid||coupon.currency!=='usd'||coupon.amount_off!==10000||coupon.duration_in_months!==12||
   !coupon.applies_to?.products?.includes(String(plan.product)))return new Response(null,{status:409});
  const {data:claim,error:ce}=await db.rpc('claim_due_roof_founder_trial',{p_reservation:id});
  if(ce||claim?.length!==1)return new Response(null,{status:409});
  const sub=await stripe.subscriptions.create({customer:ctx.customer,items:[{price}],collection_method:'charge_automatically',default_payment_method:pm.id,
   discounts:[{promotion_code:promo}],automatic_tax:{enabled:true},off_session:true,payment_behavior:'error_if_incomplete',
   metadata:{supabase_user_id:ctx.userId,pilot_terms_version:termsVersion,reservation:id}},
   {idempotencyKey:'roof-founder-first-paid:'+id});
  const saved=await db.from('roof_founder_activations').update({stripe_subscription_id:sub.id}).eq('reservation_id',id).select('reservation_id').single();
  if(saved.error)throw Error('Reconcile claim');
  return Response.json({status:sub.status});
 }catch{return Response.json({error:'Reconcile reservation and Stripe before retrying'},{status:503});}
});