import {stripe,STRIPE_MODE} from '../_shared/stripe.ts';
import {serviceClient} from '../_shared/supabase.ts';
import {termsVersion} from '../_shared/founding-card-pilot.mjs';
import {planUsageWarning} from '../_shared/paid-usage-warning.mjs';
import {dispatchWarning} from '../_shared/dispatch-usage-warning.mjs';

Deno.serve(async req => {
  if(req.method!=='POST') return new Response(null,{status:405});
  const token=Deno.env.get('ROOF_WARNING_WORKER_SECRET');
  if(!token || req.headers.get('authorization')!=='Bearer '+token) return new Response(null,{status:403});
  const key=Deno.env.get('SENDGRID_API_KEY');
  if(!key || STRIPE_MODE!=='live' || Deno.env.get('ROOF_USAGE_EMAIL_READY')!=='true' ||
     Deno.env.get('ROOF_PACK_FULFILLMENT_READY')!=='true') return new Response(null,{status:503});
  const {period_id:id}=await req.json().catch(()=>({}));
  if(typeof id!=='string' || !/^[0-9a-f-]{36}$/i.test(id)) return new Response(null,{status:400});
  const db=serviceClient();
  try {
    const result=await dispatchWarning(id,{
      async resolve() {
        const {data:p,error}=await db.from('roof_paid_periods').select('*').eq('id',id).single();
        if(error) throw error;
        const {data:c,error:ce}=await db.from('roofing_companies').select('user_id').eq('id',p.company_id).single();
        if(ce) throw ce;
        const sub=await stripe.subscriptions.retrieve(p.subscription_id,{expand:['customer']});
        const customer=sub.customer;
        if(!sub.livemode || sub.status!=='active' || sub.cancel_at_period_end || sub.metadata.supabase_user_id!==c.user_id ||
          sub.metadata.pilot_terms_version!==termsVersion || typeof customer==='string' || customer.deleted || !customer.email ||
          sub.current_period_start*1000!==Date.parse(p.starts_at) || sub.current_period_end*1000!==Date.parse(p.ends_at)) return null;
        const {data:u,error:ue}=await db.auth.admin.getUserById(c.user_id);
        if(ue) throw ue;
        if(!u.user.email_confirmed_at || u.user.email?.toLowerCase()!==customer.email.toLowerCase()) return null;
        const packs=await db.from('roof_available_packs').select('period_id',{head:true,count:'exact'}).eq('period_id',id);
        const calls=await db.from('roof_recovered_call_receipts').select('provider_event_id,occurred_at').eq('period_id',id).limit(75);
        if(packs.error || calls.error) throw Error('Incomplete usage read');
        const msg=planUsageWarning({companyId:p.company_id,startMs:Date.parse(p.starts_at),endMs:Date.parse(p.ends_at),
          phase:'paid',version:termsVersion,purchasedPacks:packs.count},calls.data.map(row=>({id:row.provider_event_id,
          atMs:Date.parse(row.occurred_at),companyId:p.company_id,billableRecovered:true})),Date.now());
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
        const r=await fetch('https://api.sendgrid.com/v3/mail/send',{method:'POST',signal:AbortSignal.timeout(8000),
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
});
