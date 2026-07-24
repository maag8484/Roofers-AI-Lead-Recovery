import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Check,
  CreditCard,
  ArrowRight,
  Shield,
  PartyPopper,
  X,
  HelpCircle,
  UserCircle,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { AccountMenu } from "@/components/AccountMenu";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { formatPhone } from "@/lib/utils";

export default function DashboardPage() {
  const { user, profile, isAdmin, onboardingCompleted, markOnboardingComplete } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(1);

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("subscriptions")
      .select("status, trial_ends_at")
      .eq("user_id", user.id)
      .maybeSingle();
    setSubscription(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // New-flow gate: a customer must (1) have paid, then (2) have submitted the
  // onboarding details form before they can use the dashboard. Send them to
  // whichever step is missing. Admins are exempt. Runs after data is loaded.
  useEffect(() => {
    if (loading || isAdmin) return;
    const paid = ["active", "trialing"].includes(subscription?.status);
    if (!paid) {
      navigate("/checkout", { replace: true });
    } else if (!profile?.details_submitted) {
      navigate("/onboarding", { replace: true });
    }
  }, [loading, isAdmin, subscription, profile, navigate]);

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setShowPaymentSuccess(true);
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams]);

  const isLive = profile?.status === "live" || profile?.is_live;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Payment success modal */}
      {showPaymentSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
            <button
              onClick={() => setShowPaymentSuccess(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-secondary"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <PartyPopper className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="mb-2 text-2xl font-extrabold text-ink">Payment Successful!</h2>
            <p className="mb-1 text-muted-foreground">
              Welcome to Roof AI Lead Recovery. Your subscription is now active.
            </p>
            <p className="mb-6 text-sm text-muted-foreground">
              Our team is configuring your AI receptionist — we'll take it from here.
            </p>
            <Button className="w-full" onClick={() => setShowPaymentSuccess(false)}>
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Replayable product tour (Help → Product Tour). Only rendered when it
          hasn't been completed, or when explicitly reopened this session. */}
      <OnboardingModal
        open={tourOpen}
        step={tourStep}
        setStep={setTourStep}
        onClose={() => setTourOpen(false)}
        onFinish={() => setTourOpen(false)}
        finishing={false}
        finishLabel="Done"
        finishIcon={Check}
      />

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-white">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" aria-label="Roof AI Lead Recovery home">
            <Logo />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            {isAdmin && (
              <Button variant="secondary" size="sm" asChild>
                <Link to="/admin">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline"> Admin</span>
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link to="/account">
                <UserCircle className="h-4 w-4" />
                <span className="hidden sm:inline"> Account</span>
              </Link>
            </Button>
            {/* Product tour reopen — hidden once completed (never nag again). */}
            {!onboardingCompleted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTourStep(1);
                  setTourOpen(true);
                }}
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline"> Product tour</span>
              </Button>
            )}
            <AccountMenu />
          </div>
        </div>
      </header>

      <main className="container max-w-5xl space-y-6 py-8">
        {/* Greeting */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-ink">
              Welcome, {profile?.company_name || "there"}!
            </h1>
            <p className="text-muted-foreground">Here's what's happening with your leads.</p>
          </div>
          <StatusBadge status={profile?.status} isLive={isLive} />
        </div>

        {/* Onboarding checklist — reflects the REAL flow. Hidden once live. */}
        {!isLive && (
          <OnboardingChecklist status={profile?.status} subscription={subscription} />
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Business Phone</p>
              {profile?.business_phone ? (
                <p className="mt-1 text-lg font-extrabold text-ink">
                  {formatPhone(profile.business_phone)}
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">—</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Forwards to your AI receptionist.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 p-6">
              <p className="mb-1 text-sm font-medium text-muted-foreground">Manage</p>
              <SettingsLink icon={UserCircle} to="/account" label="Account overview" />
              <SettingsLink icon={CreditCard} to="/billing" label="Billing" />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Onboarding checklist — mirrors the actual customer journey. The Twilio/
// Calendar self-serve steps were removed; provisioning is handled by the team
// (reflected by the account status: new -> in_progress -> live).
// ---------------------------------------------------------------------------
function OnboardingChecklist({ status, subscription }) {
  const paid = ["active", "trialing"].includes(subscription?.status);
  const detailsDone = true; // dashboard is only reachable after details submitted
  const reviewing = status === "in_progress";
  const live = status === "live";

  const steps = [
    { label: "Account created", state: "done" },
    { label: "Subscription active", state: paid ? "done" : "todo" },
    { label: "Business information submitted", state: detailsDone ? "done" : "todo" },
    {
      label: "Our team is configuring your AI receptionist",
      state: live ? "done" : reviewing ? "active" : "todo",
    },
    { label: "AI activated — recovering calls 24/7", state: live ? "done" : "todo" },
  ];

  return (
    <Card className="border-brand-200 bg-brand-50/40">
      <CardContent className="p-6">
        <h2 className="mb-1 font-bold text-ink">Your setup</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          You're all set on your end — our team takes it from here. No action needed.
        </p>
        <div className="space-y-2.5">
          {steps.map((s) => (
            <ChecklistRow key={s.label} label={s.label} state={s.state} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ChecklistRow({ label, state }) {
  let icon;
  let textClass = "text-ink";
  if (state === "done") {
    icon = (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  } else if (state === "active") {
    icon = (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-600">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </span>
    );
    textClass = "font-medium text-brand-700";
  } else {
    icon = <span className="h-6 w-6 rounded-full border-2 border-border bg-white" />;
    textClass = "text-muted-foreground";
  }
  return (
    <div className="flex items-center gap-3">
      {icon}
      <span className={textClass}>{label}</span>
    </div>
  );
}

// Reflects the admin-driven lifecycle status. Falls back to the is_live flag.
function StatusBadge({ status, isLive }) {
  const map = {
    new: { variant: "warning", dot: "bg-amber-500", label: "Setting up" },
    in_progress: { variant: "default", dot: "bg-brand-500", label: "In progress" },
    live: { variant: "success", dot: "bg-emerald-500", label: "Live" },
    paused: { variant: "muted", dot: "bg-muted-foreground", label: "Paused" },
  };
  const s = map[status] ?? (isLive ? map.live : map.new);
  return (
    <Badge variant={s.variant} className="py-1.5 text-sm">
      <span className={"h-2 w-2 rounded-full " + s.dot} /> {s.label}
    </Badge>
  );
}

function SettingsLink({ icon: Icon, to, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-ink hover:bg-secondary"
    >
      <Icon className="h-4 w-4 text-muted-foreground" /> {label}
    </Link>
  );
}
