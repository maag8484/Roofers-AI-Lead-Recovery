import {useState} from 'react';
import {supabase} from '@/lib/supabase';
// Rendered only for a paid plan; the server independently verifies the user,
// subscription metadata, current paid period, and pack price before Checkout.
export default function CurrentPeriodPacks() {
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function checkout(calls){if(busy)return;setBusy(true);setError('');
 try{const r=await supabase.functions.invoke('paid-pack-checkout',{body:{calls}});
 if(r.error||!r.data?.url)throw Error();const u=new URL(r.data.url);if(u.origin!=='https://checkout.stripe.com')throw Error();
 window.location.assign(u.href);}catch{setBusy(false);setError('No pack was purchased. Checkout is unavailable for this billing period.');}}
 return <section className="space-y-3"><h2>Extra calls for this billing period</h2><p>Packs are optional one-time purchases. Review the purchase in Stripe before you pay.</p><button disabled={busy} onClick={()=>checkout(20)} type="button" className="underline">Review 20 extra calls for $50</button>{' · '}<button disabled={busy} onClick={()=>checkout(50)} type="button" className="underline">Review 50 extra calls for $100</button>{error&&<p role="alert">{error}</p>}</section>;
}