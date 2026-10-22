import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { isSubscriptionActive, pickActiveSubscription } from '@/lib/subscription';
import { hasPilotRequest, pilotMetadata } from '@/lib/pilot';
import { PilotTerms, SetupFraming } from '@/components/onboarding/PilotTerms';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { Spinner } from '@/components/ui/spinner';

// The historical /checkout confirmation redirect is intentionally retained.
// New pilots never invoke Stripe or create a subscription.
export default function CheckoutPage() {
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
  if (checking) return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>;
  return <main className="mx-auto max-w-2xl space-y-6 px-5 py-12"><Logo />
    <h1 className="text-3xl font-bold">Start the Free 30-Day Pilot</h1>
    <SetupFraming /><PilotTerms />
    <form onSubmit={continueSetup} className="space-y-4">
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" required checked={accepted} onChange={e=>setAccepted(e.target.checked)} />I operate a roofing company with a forwardable business line, have not used a pilot before, and accept these terms.</label>
      <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Continue to Free Setup'}</Button>
    </form>
  </main>;
}
