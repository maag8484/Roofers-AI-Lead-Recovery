import {serviceClient} from '../_shared/supabase.ts';
import {stripe,STRIPE_MODE} from '../_shared/stripe.ts';
import {founderContext,ownedSetup} from '../_shared/founding-card-setup.mjs';
import {termsVersion} from '../_shared/founding-card-pilot.mjs';
// Trusted installation worker supplies a real verified live-test receipt, not signup metadata.
Deno.serve(async req=>{
 if(req.method!=='POST')return new Response(null,{status:405});
 const key=Deno.env.get('ROOF_FOUNDER_ACTIVATION_SECRET');
 if(!key||key.length<32||req.headers.get('authorization')!=='Bearer '+key)return new Response(null,{status:403});
 if(Deno.env.get('ROOF_FOUNDER_ACTIVATION_READY')!=='true')return new Response(null,{status:503});
 const b=await req.json().catch(()=>null),now=Date.now(),at=Date.parse(b?.live_test_at);
 if(!b||!Number.isFinite(at)||at>now||at<now-300000||typeof b.receipt!=='string'||!b.receipt.trim()||b.receipt.length>200||typeof b.setup_session!=='string'||!b.setup_session.startsWith('cs_'))return new Response(null,{status:400});
 try{
 const db=serviceClient();
 const c=await db.from('roofing_companies').select('id,user_id,is_live,details_submitted').eq('id',b.company_id).single();
 if(c.error||!c.data?.is_live||!c.data.details_submitted)return new Response(null,{status:409});
 const u=await db.auth.admin.getUserById(c.data.user_id);
 if(u.error||!u.data.user)return new Response(null,{status:409});
 const ctx=founderContext(u.data.user);
 const session=await stripe.checkout.sessions.retrieve(b.setup_session,{expand:['setup_intent']});
 if(!ownedSetup(session,ctx,STRIPE_MODE==='live')||session.created*1000>at||session.metadata?.consent_request==null)return new Response(null,{status:409});
 const result=await db.from('roof_founder_activations').insert({reservation_id:ctx.reservation,user_id:ctx.userId,company_id:c.data.id,customer_id:ctx.customer,
 setup_session_id:session.id,live_test_receipt:b.receipt,activated_at:new Date(at).toISOString(),consent_version:termsVersion});
 if(result.error)return new Response(null,{status:409});
 return Response.json({activated_at:new Date(at).toISOString(),first_charge_at:new Date(at+336*3600000).toISOString()});
 }catch{return new Response(null,{status:409});}
});
