// Private Checkout for an authenticated paid account. The client chooses only
// pack size; the server owns price, company, period and Stripe customer.
import { handleOptions, json } from "../_shared/cors.ts";
import { getUser, serviceClient } from "../_shared/supabase.ts";
import { stripe, STRIPE_MODE } from "../_shared/stripe.ts";

const prices: Record<string,string> = {"20":"price_1UXn65CB5wADtZS19CXdROLL","50":"price_1UXn66CB5wADtZS12VbDpqYh"};
Deno.serve(async req => {
  const pre=handleOptions(req); if(pre) return pre;
  if(req.method!=="POST") return json({error:"Method not allowed"},405);
  if(STRIPE_MODE!=="live" || Deno.env.get("ROOF_PACK_FULFILLMENT_READY")!=="true") return json({error:"Pack purchases unavailable"},503);
  const {user}=await getUser(req); if(!user) return json({error:"Unauthorized"},401);
  const input=await req.json().catch(()=>null);
  if(!input || ![20,50].includes(input.calls)) return json({error:"Select 20 or 50 calls"},400);
  const db=serviceClient(), now=new Date().toISOString();
  try {
    const {data:company,error:ce}=await db.from("roofing_companies").select("id").eq("user_id",user.id).single();
    if(ce || !company) return json({error:"Company unavailable"},403);
    const {data:period,error:pe}=await db.from("roof_paid_periods").select("*").eq("company_id",company.id).lte("starts_at",now).gt("ends_at",now).single();
    if(pe || !period) return json({error:"No verified paid period"},409);
    const sub=await stripe.subscriptions.retrieve(period.subscription_id);
    const end=Math.floor(Date.parse(period.ends_at)/1000), sec=Math.floor(Date.now()/1000);
    if(!sub.livemode || sub.status!=="active" || sub.metadata.supabase_user_id!==user.id ||
       sub.metadata.pilot_terms_version!=="pilot-14d-40calls-199-card-v4" ||
       sub.current_period_start!==Math.floor(Date.parse(period.starts_at)/1000) ||
       sub.current_period_end!==end || end-sec<1860) return json({error:"No eligible paid period"},409);
    const session=await stripe.checkout.sessions.create({mode:"payment", customer:String(sub.customer),
      line_items:[{price:prices[input.calls],quantity:1}], expires_at:Math.min(sec+3600,end-30),
      metadata:{purpose:"roof_call_pack",period_id:period.id,company_id:company.id,pack_calls:String(input.calls)},
      success_url:"https://www.roofaileadrecovery.com/dashboard",cancel_url:"https://www.roofaileadrecovery.com/dashboard"});
    return json({url:session.url});
  } catch {return json({error:"Pack purchase unavailable"},503);}
});
