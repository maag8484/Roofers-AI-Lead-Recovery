import {useRef, useState} from 'react';
import {supabase} from '@/lib/supabase';

export default function CurrentPeriodPacks() {
  const request = useRef({});
  const locked = useRef(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function checkout(calls) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try {
      // Keep the same request across uncertain retries, including a page reload.
      // A different pack selection is a separate explicit purchase request.
      const key = `roof-pack-request-${calls}`;
      let attempt = request.current[calls];
      if (!attempt) {
        try { attempt = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { /* unavailable storage */ }
      }
      {
        const sec = Math.floor(Date.now() / 1000);
        if (!attempt || !attempt.request_id || !Number.isSafeInteger(attempt.requested_at) ||
            sec - attempt.requested_at > 600 || attempt.requested_at > sec + 60) {
          attempt = {request_id: crypto.randomUUID(), requested_at: sec};
          try { sessionStorage.setItem(key, JSON.stringify(attempt)); } catch { /* ref still dedupes this page */ }
        }
        request.current[calls] = attempt;
      }
      const r = await supabase.functions.invoke('paid-pack-checkout', {body: {calls, ...attempt}});
      if (r.error || !r.data?.url) throw Error();
      const url = new URL(r.data.url);
      if (url.origin !== 'https://checkout.stripe.com') throw Error();
      window.location.assign(url.href);
    } catch {
      locked.current = false; setBusy(false);
      setError('Checkout could not be confirmed. Retry to reopen the same purchase. Your call allowance changes only after payment is verified.');
    }
  }
  return <section className="space-y-3 rounded-xl border border-border bg-white p-6">
    <h2 className="font-bold text-ink">Extra calls for this billing period</h2>
    <p>Packs are optional one-time purchases for the current billing period. Unused extra calls expire at the end of that period. Review the purchase in Stripe before paying.</p>
    <div className="flex flex-wrap gap-4">
      <button disabled={busy} onClick={() => checkout(20)} type="button" className="underline disabled:opacity-50">Review 20 extra calls for $50</button>
      <button disabled={busy} onClick={() => checkout(50)} type="button" className="underline disabled:opacity-50">Review 50 extra calls for $100</button>
    </div>
    {error && <p role="alert">{error}</p>}
  </section>;
}
