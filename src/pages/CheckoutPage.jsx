import FoundingCardSetup from './FoundingCardSetup';
import {termsVersion} from '../../supabase/functions/_shared/founding-card-pilot.mjs';
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

// The historical /checkout confirmation redirect is intentionally retained.
// Only a server-reserved, explicitly accepted v4 offer can enter card setup.
export default function CheckoutPage() {
  const { user } = useAuth();
  const offer = user?.app_metadata?.roof_founding_offer;
  return offer?.version === termsVersion && offer.status === 'reserved' && offer.user_id === user?.id
    ? <FoundingCardSetup /> : <LegacyPilotCheckout />;
}
function LegacyPilotCheckout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accepted, setAccepted] = useState(false);
  useEffect(() => {
    if (!user) return;
    supabase.from('subscriptions').select('status, created_at').eq('user_id', user.id)
      .order('created_at', { ascending: false }).then(({data, error}) => {
        if (error) { setLoadError(true); setChecking(false); return; }
        if (isSubscriptionActive(pickActiveSubscription(data)) || hasPilotRequest(user)) {
          navigate('/onboarding', { replace: true });
        } else setChecking(false);
      });
  }, [user, navigate]);
  async function continueSetup(event) {
    event.preventDefault();
    if (!accepted || saving) return;
    setSaving(true);
    const {error} = await supabase.auth.updateUser({data: pilotMetadata()});
    if (error) { toast.error(error.message); setSaving(false); return; }
    navigate('/onboarding', {replace:true});
  }
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
