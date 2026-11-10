import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { isSubscriptionActive, pickActiveSubscription } from '@/lib/subscription';
import { hasPilotRequest, pilotMetadata } from '@/lib/pilot';
import { PilotTerms, SetupFraming } from '@/components/onboarding/PilotTerms';
import { Button } from '@/components/ui/button';
import { FoundingDisclosure } from '@/components/onboarding/FoundingDisclosure';
import { Logo } from '@/components/Logo';
import { Spinner } from '@/components/ui/spinner';

const FOUNDING_TERMS = 'pilot-14d-40calls-199-card-v4';

// Eligible, email-confirmed founders explicitly authorize a saved card through
// a Stripe setup-mode Checkout Session. The server independently verifies eligibility.
export default function CheckoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [cardBusy, setCardBusy] = useState(false);
  const [cardError, setCardError] = useState('');
  const founding = user?.app_metadata?.roof_founding_offer;
  const eligible = Boolean(user?.email_confirmed_at && founding?.version === FOUNDING_TERMS && founding?.status === 'reserved' && founding?.user_id === user?.id);
  useEffect(() => {
    if (!user || eligible) { setChecking(false); return; }
    supabase.from('subscriptions').select('status, created_at').eq('user_id', user.id)
      .order('created_at', { ascending: false }).then(({data, error}) => {
        if (error) { setLoadError(true); setChecking(false); return; }
        if (isSubscriptionActive(pickActiveSubscription(data)) || hasPilotRequest(user)) {
          navigate('/onboarding', { replace: true });
        } else setChecking(false);
      });
  }, [user, navigate, eligible]);
  async function authorizeFoundingCard(event) {
    event.preventDefault();
    if (!eligible || !accepted || cardBusy) return;
    setCardBusy(true);
    setCardError('');
    try {
      const requestId = crypto.randomUUID();
      const { data, error } = await supabase.functions.invoke('founding-card-setup', {
        body: { action: 'start', accepted: true, terms: FOUNDING_TERMS, request_id: requestId },
      });
      if (error || !data?.url || !/^https:\/\/checkout\.stripe\.com\//.test(data.url)) throw new Error('Card authorization is temporarily unavailable. Please contact support.');
      window.location.assign(data.url);
    } catch (error) {
      setCardError(error.message || 'Unable to start card authorization.');
      setCardBusy(false);
    }
  }
  async function continueSetup(event) {
    event.preventDefault();
    if (!accepted || saving) return;
    setSaving(true);
    const {error} = await supabase.auth.updateUser({data: pilotMetadata()});
    if (error) { toast.error(error.message); setSaving(false); return; }
    navigate('/onboarding', {replace:true});
  }
  if (eligible) return <main className="mx-auto max-w-2xl space-y-6 px-5 py-12"><Logo />
    <h1 className="text-3xl font-bold">Reserve Your Founding Pilot</h1>
    <FoundingDisclosure />
    <form onSubmit={authorizeFoundingCard} className="space-y-4">
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" required checked={accepted} onChange={e=>setAccepted(e.target.checked)} />I authorize Roof AI to securely save my card. Nothing is due at reservation. After setup and a successful live test, my 14-day pilot begins (up to 40 recovered calls). Unless I cancel before the 14 full days end, I authorize $199/month for 12 paid months, then $299/month, plus applicable tax. The paid plan includes 75 recovered calls per month. Extra call packs are optional.</label>
      {cardError && <p role="alert" className="text-red-600">{cardError}</p>}
      <Button type="submit" disabled={!accepted || cardBusy}>{cardBusy ? 'Opening secure authorization…' : 'Authorize Card — $0 Due Today'}</Button>
    </form>
  </main>;
  if (loadError) return <main className="mx-auto max-w-lg space-y-4 p-8"><h1 className="text-2xl font-bold">We could not check your account</h1><p>Please retry before continuing. No payment or pilot has been started.</p><Button onClick={()=>window.location.reload()}>Retry account check</Button><a className="block underline" href="/">Back to home</a></main>;
  if (!checking && user?.user_metadata?.founding_application === 'founding-v4-request') return <main className="mx-auto max-w-2xl space-y-6 px-5 py-12"><Logo /><h1 className="text-3xl font-bold">Founding pilot application received</h1><p>Your email is confirmed. Your pilot has not started. Eligibility and your quoted rate must be confirmed before you can reserve a place.</p><FoundingDisclosure /><a className="underline" href="/#inquiry">Request a callback about setup</a></main>;
  if (checking) return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>;
  return <main className="mx-auto max-w-2xl space-y-6 px-5 py-12"><Logo />
    <h1 className="text-3xl font-bold">Start the Free 14-Day Pilot</h1>
    <SetupFraming /><PilotTerms />
    <form onSubmit={continueSetup} className="space-y-4">
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" required checked={accepted} onChange={e=>setAccepted(e.target.checked)} />I operate a roofing company with a forwardable business line, have not used a pilot before, and accept these terms.</label>
      <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Continue to Free Setup'}</Button>
    </form>
  </main>;
}
