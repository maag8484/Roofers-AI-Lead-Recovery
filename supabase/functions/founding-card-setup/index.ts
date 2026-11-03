import {handleOptions,json} from '../_shared/cors.ts';
import {getUser} from '../_shared/supabase.ts';
import {stripe,STRIPE_MODE} from '../_shared/stripe.ts';
import {termsVersion} from '../_shared/founding-card-pilot.mjs';
import {consentCopy,founderContext,ownedSetup} from '../_shared/founding-card-setup.mjs';
Deno.serve(async req=>{
  const pre=handleOptions(req);if(pre)return pre;
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  if(Deno.env.get('ROOF_CARD_SETUP_READY')!=='true')return json({error:'Card setup unavailable'},503);
  const {user}=await getUser(req);if(!user)return json({error:'Sign in required'},401);
  let ctx;
  try{ctx=founderContext(user);}catch{return json({error:'No eligible reserved offer'},403);}
  const input=await req.json().catch(()=>null);
  if(!input)return json({error:'Invalid request'},400);
  try{
    if(input.action==='verify'){
      if(!/^cs_(live|test)_[a-zA-Z0-9]+$/.test(input.session_id))return json({error:'Invalid session'},400);
      const session=await stripe.checkout.sessions.retrieve(input.session_id,{expand:['setup_intent']});
      return json({verified:ownedSetup(session,ctx,STRIPE_MODE==='live')});
    }
    if(input.action!=='start' || input.accepted!==true || input.terms!==termsVersion ||
       !/^[a-f0-9-]{36}$/i.test(input.request_id))return json({error:'Explicit acceptance required'},400);
    const cust=await stripe.customers.retrieve(ctx.customer);
    if(cust.deleted || cust.metadata.supabase_user_id!==user.id || cust.email?.toLowerCase()!==user.email?.toLowerCase())return json({error:'Customer mismatch'},409);
    const metadata={terms:termsVersion,user_id:user.id,reservation:ctx.reservation,
      consent_text:consentCopy,consent_request:input.request_id};
    const session=await stripe.checkout.sessions.create({
      mode:'setup',currency:'usd',customer:ctx.customer,client_reference_id:user.id,metadata,
      setup_intent_data:{metadata},custom_text:{submit:{message:consentCopy}},
      success_url:'https://www.roofaileadrecovery.com/checkout?setup_session={CHECKOUT_SESSION_ID}',
      cancel_url:'https://www.roofaileadrecovery.com/checkout'
    },{idempotencyKey:'roof-setup:'+ctx.reservation+':'+input.request_id});
    return json({url:session.url});
  }catch{return json({error:'Card setup could not be verified'},503);}
});
