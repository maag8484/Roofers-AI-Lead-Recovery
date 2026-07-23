import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase, invokeFunction } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AccountMenu } from "@/components/AccountMenu";
import { WelcomeHero } from "@/components/onboarding/WelcomeHero";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";

// New first-run experience: a full welcome page with an auto-opening 5-step
// onboarding wizard. The wizard's final CTA ("Start Free Trial") kicks off the
// existing Stripe Checkout. This replaces the old bare price-card checkout.
export default function CheckoutPage() {
  const { user, onboardingCompleted, markOnboardingComplete } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [checking, setChecking] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);

  // If the user already paid (refreshed / came back), skip ahead to onboarding.
  useEffect(() => {
    if (!user) return;
    supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data && ["active", "trialing"].includes(data.status)) {
          navigate("/onboarding", { replace: true });
        } else {
          setChecking(false);
        }
      });
  }, [user, navigate]);

  // Auto-open the wizard on first visit (or when ?tour=1 from the dashboard's
  // Help → Product Tour). Never auto-opens once completed unless explicitly
  // requested via the param.
  useEffect(() => {
    if (checking) return;
    const forced = searchParams.get("tour") === "1";
    if (forced || !onboardingCompleted) {
      setStep(1);
      setModalOpen(true);
    }
  }, [checking, onboardingCompleted, searchParams]);

  const closeModal = () => {
    setModalOpen(false);
    if (!onboardingCompleted) markOnboardingComplete();
  };

  const startCheckout = async () => {
    setRedirecting(true);
    try {
      // Remember they've seen onboarding before we leave for Stripe.
      if (!onboardingCompleted) markOnboardingComplete();
      const res = await invokeFunction("stripe-create-checkout", {
        success_url: `${window.location.origin}/onboarding?payment=success`,
        cancel_url: `${window.location.origin}/checkout`,
      });
      if (res?.url) window.location.href = res.url;
      else throw new Error(res?.error ?? "No checkout URL returned.");
    } catch (err) {
      console.error(err);
      toast.error("Could not start checkout. Please try again.");
      setRedirecting(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const ownerName = user?.user_metadata?.full_name?.split(" ")[0] || "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/60 via-secondary/30 to-secondary/30">
      <header className="border-b border-border bg-white/70 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" aria-label="Roof AI Lead Recovery home">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            {!onboardingCompleted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStep(1);
                  setModalOpen(true);
                }}
              >
                <HelpCircle className="h-4 w-4" /> Product tour
              </Button>
            )}
            <AccountMenu />
          </div>
        </div>
      </header>

      <WelcomeHero
        ownerName={ownerName}
        onStart={() => {
          setStep(1);
          setModalOpen(true);
        }}
      />

      <OnboardingModal
        open={modalOpen}
        step={step}
        setStep={setStep}
        onClose={closeModal}
        onFinish={startCheckout}
        finishing={redirecting}
      />
    </div>
  );
}
