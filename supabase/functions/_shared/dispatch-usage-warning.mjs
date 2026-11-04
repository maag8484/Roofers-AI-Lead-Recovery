import {currentPaidSettlement} from './current-paid-settlement.mjs';
import {termsVersion} from './founding-card-pilot.mjs';
import {planUsageWarning} from './paid-usage-warning.mjs';

// Only a pending row may be claimed. Once a provider request starts, never
// automatically retry it: even a timeout can mean the provider accepted it.
export async function dispatchWarning(id, {resolve,claim,send,finish}) {
  if (!await resolve(id)) return 'ineligible';
  if (!await claim(id)) return 'already_handled';
  const mail = await resolve(id); // recheck eligibility and fresh usage after claim
  if (!mail) {await finish(id,'suppressed',null);return 'suppressed';}
  const receipt = await send(mail,id);
  if (!receipt) throw Error('Provider acceptance uncertain; reconcile claimed row');
  await finish(id,'sent',receipt);
  return 'provider_accepted';
}

export function createUsageWarningHandler({stripe, mode, db, token, sendgridKey: key, ready, fetcher = fetch, now = Date.now}) {
 return async req => {
  if(req.method!=='POST') return new Response(null,{status:405});
  if(!token || token.length < 32 || req.headers.get('authorization')!=='Bearer '+token) return new Response(null,{status:403});
  if(!key || mode!=='live' || !ready) return new Response(null,{status:503});
  const input=await req.json().catch(()=>null);
  const id=input?.period_id;
  if(typeof id!=='string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return new Response(null,{status:400});
  try {
    const result=await dispatchWarning(id,{
      async resolve() {
        const {data:p,error}=await db.from('roof_paid_periods').select('*').eq('id',id).single();
        if(error) throw error;
        if(!p) return null;
        const {data:c,error:ce}=await db.from('roofing_companies').select('user_id').eq('id',p.company_id).single();
        if(ce) throw ce;
        if(!c) return null;
        const sub=await stripe.subscriptions.retrieve(p.subscription_id,{expand:['customer']});
        const customer=sub.customer;
        if(!sub.livemode || sub.status!=='active' || sub.cancel_at_period_end || sub.metadata.supabase_user_id!==c.user_id ||
          sub.metadata.pilot_terms_version!==termsVersion || !customer || typeof customer==='string' || customer.deleted || !customer.livemode || !customer.email ||
          customer.metadata?.supabase_user_id!==c.user_id ||
          sub.current_period_start*1000!==Date.parse(p.starts_at) || sub.current_period_end*1000!==Date.parse(p.ends_at)) return null;
        if (!await currentPaidSettlement(sub, stripe)) return null;
        const {data:u,error:ue}=await db.auth.admin.getUserById(c.user_id);
        if(ue) throw ue;
        if(!u?.user?.email_confirmed_at || u.user.email?.toLowerCase()!==customer.email.toLowerCase()) return null;
        const packs=await db.from('roof_available_packs').select('period_id',{head:true,count:'exact'}).eq('period_id',id);
        const calls=await db.from('roof_recovered_call_receipts').select('provider_event_id,occurred_at').eq('period_id',id).limit(75);
        if(packs.error || calls.error) throw Error('Incomplete usage read');
        const msg=planUsageWarning({companyId:p.company_id,startMs:Date.parse(p.starts_at),endMs:Date.parse(p.ends_at),
          phase:'paid',version:termsVersion,purchasedPacks:packs.count},calls.data.map(row=>({id:row.provider_event_id,
          atMs:Date.parse(row.occurred_at),companyId:p.company_id,billableRecovered:true})),now());
        return msg ? {...msg,to:customer.email} : null;
      },
      async claim() {
        const r=await db.from('roof_usage_warning_outbox').update({delivery_state:'claimed'}).eq('period_id',id)
          .eq('delivery_state','pending').select('period_id').maybeSingle();
        if(r.error) throw r.error;
        return !!r.data;
      },
      async send(mail) {
        const from='cory@roofaileadrecovery.com';
        const r=await fetcher('https://api.sendgrid.com/v3/mail/send',{method:'POST',signal:AbortSignal.timeout(8000),
          headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({
            from:{email:from,name:'Roof AI Lead Recovery'},reply_to:{email:from},
            personalizations:[{to:[{email:mail.to}],custom_args:{roof_period_id:id}}],
            subject:mail.subject,content:[{type:'text/plain',value:mail.text}]
          })});
        return r.status===202 ? r.headers.get('x-message-id') : null;
      },
      async finish(_id,state,receipt) {
        const r=await db.from('roof_usage_warning_outbox').update({delivery_state:state,provider_receipt:receipt})
          .eq('period_id',id).eq('delivery_state','claimed').select('period_id').single();
        if(r.error) throw r.error;
      }
    });
    return Response.json({result});
  } catch {return Response.json({error:'Check outbox and provider receipts before retrying'},{status:503});}
 };
}
