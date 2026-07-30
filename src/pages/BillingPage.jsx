import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CreditCard, LogOut, ChevronLeft, CheckCircle2, AlertCircle, Clock, Pause, Play, X } from "lucide-react";
import { toast } from "sonner";
import { supabase, invokeFunction } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CancellationFlow } from "@/components/CancellationFlow";

export default function BillingPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [showCancelFlow, setShowCancelFlow] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);
  const [justResumed, setJustResumed] = useState(false);

  const fetchSubscription = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("subscriptions")
      .select("status, trial_ends_at, current_period_end, stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    setSubscription(data ?? null);
  };

  useEffect(() => {
    if (!user) return;
    fetchSubscription().finally(() => setLoading(false));
  }, [user]);

  const startCheckout = async () => {
    setRedirecting(true);
    try {
      const res = await invokeFunction("stripe-create-checkout", {
        success_url: `${window.location.origin}/dashboard?payment=success`,
        cancel_url: window.location.href,
      });
      if (res?.url) window.location.href = res.url;
      else throw new Error(res?.error ?? "No checkout URL returned.");
    } catch (err) {
      console.error(err);
      toast.error("Could not start checkout. Please try again.");
      setRedirecting(false);
    }
  };

  const openPortal = async () => {
    setRedirecting(true);
    try {
      const res = await invokeFunction("stripe-billing-portal", { return_url: window.location.href });
      if (res?.url) window.location.href = res.url;
      else throw new Error(res?.error ?? "No portal URL returned.");
    } catch (err) {
      console.error(err);
      toast.error("Could not open billing portal. Please try again.");
      setRedirecting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleKeep = () => {
    setShowCancelFlow(false);
    toast.success("Great! Your account is still active.");
  };

  const handleConfirmCancel = () => {
    setShowCancelFlow(false);
    setCancelDone(true);
    openPortal();
  };

  const handlePause = async (pauseDays) => {
    const days = typeof pauseDays === "number" ? pauseDays : 60;
    setShowCancelFlow(false);

    // Stripe cannot pause a trialing subscription
    if (subscription?.status === "trialing") {
      toast.info("You're on a free trial until " + fmt(subscription.trial_ends_at) + " — no billing will occur. No need to pause!");
      return;
    }

    setRedirecting(true);
    try {
      const res = await invokeFunction("stripe-pause-subscription", { pause_days: days });
      if (res?.ok) {
        setJustResumed(false);
        toast.success(`Account paused for ${days} days. No billing until then.`);
        await fetchSubscription();
      } else {
        throw new Error(res?.error ?? "Could not pause subscription.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message ?? "Could not pause. Please contact support.");
    } finally {
      setRedirecting(false);
    }
  };

  const handleResume = async () => {
    setRedirecting(true);
    try {
      const res = await invokeFunction("stripe-resume-subscription", {});
      if (res?.ok) {
        setJustResumed(true);
        toast.success("Account resumed! Your AI is back active.");
        await fetchSubscription();
      } else {
        throw new Error(res?.error ?? "Could not resume subscription.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message ?? "Could not resume. Please contact support.");
    } finally {
      setRedirecting(false);
    }
  };

  const statusInfo = (status) => {
    if (status === "active")   return { label: "Active",   icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" };
    if (status === "trialing") return { label: "Trial",    icon: Clock,        color: "text-brand-600",   bg: "bg-brand-50"   };
    if (status === "paused")   return { label: "Paused",   icon: Pause,        color: "text-amber-600",   bg: "bg-amber-50"   };
    if (status === "canceled") return { label: "Canceled", icon: AlertCircle,  color: "text-red-600",     bg: "bg-red-50"     };
    return                            { label: status ?? "No plan", icon: AlertCircle, color: "text-muted-foreground", bg: "bg-secondary" };
  };

  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const info = statusInfo(subscription?.status);
  const StatusIcon = info.icon;
  const isActive = ["active", "trialing"].includes(subscription?.status);
  const isPaused = subscription?.status === "paused";

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-30 border-b border-border bg-white">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-ink transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <Link to="/dashboard"><Logo /></Link>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </header>

      <main className="container max-w-2xl space-y-6 py-10">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Billing</h1>
          <p className="text-muted-foreground">Manage your subscription and payment details.</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-ink">Current Plan</h2>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${info.bg} ${info.color}`}>
                <StatusIcon className="h-4 w-4" />
                {info.label}
              </span>
            </div>

            <div className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">Roof AI Lead Recovery</span>
                <span className="font-bold text-ink">$299<span className="text-sm font-normal text-muted-foreground">/month</span></span>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>✓ Missed call recovery — 24/7</li>
                <li>✓ AI-powered lead qualification</li>
                <li>✓ Auto-book estimates on your calendar</li>
                <li>✓ Dedicated business phone number</li>
                <li>✓ Real-time dashboard</li>
              </ul>
            </div>

            {!subscription && (
              <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-3">
                <p className="text-muted-foreground text-sm">No active subscription found.</p>
                <Button className="w-full" onClick={startCheckout} disabled={redirecting}>
                  {redirecting ? <Spinner className="text-white" /> : <><CreditCard className="h-4 w-4" /> Subscribe Now — $299/month</>}
                </Button>
              </div>
            )}

            {subscription && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                {subscription.trial_ends_at && subscription.status === "trialing" && (
                  <div className="rounded-lg bg-brand-50 p-3">
                    <p className="text-xs text-muted-foreground">Trial ends</p>
                    <p className="font-semibold text-ink">{fmt(subscription.trial_ends_at)}</p>
                  </div>
                )}
                {subscription.current_period_end && subscription.status === "active" && (
                  <div className="rounded-lg bg-secondary p-3">
                    <p className="text-xs text-muted-foreground">Next billing date</p>
                    <p className="font-semibold text-ink">{fmt(subscription.current_period_end)}</p>
                  </div>
                )}
              </div>
            )}

            {subscription?.stripe_customer_id && (
              <Button className="w-full" onClick={openPortal} disabled={redirecting}>
                {redirecting ? <Spinner className="text-white" /> : <><CreditCard className="h-4 w-4" /> Manage Subscription & Billing</>}
              </Button>
            )}

            <p className="text-xs text-center text-muted-foreground">
              You'll be redirected to Stripe's secure billing portal to update your card or view invoices.
            </p>
          </CardContent>
        </Card>

        {/* PAUSED — show resume banner */}
        {isPaused && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <Pause className="h-5 w-5 text-amber-600" />
                </span>
                <div>
                  <p className="font-bold text-ink">Account is paused</p>
                  <p className="text-sm text-muted-foreground">No billing during this period. Your settings are saved.</p>
                </div>
              </div>
              <Button className="w-full" onClick={handleResume} disabled={redirecting}>
                {redirecting ? <Spinner className="text-white" /> : <><Play className="h-4 w-4" /> Resume Account Now</>}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ACTIVE — show pause/cancel actions */}
        {isActive && !cancelDone && (
          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="font-bold text-ink">Account Actions</h2>
              <p className="text-sm text-muted-foreground">
                Need a break or want to cancel? We have options that may work better than cancelling outright.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="secondary" className="flex-1" onClick={handlePause} disabled={redirecting}>
                  {redirecting ? <Spinner /> : <><Pause className="h-4 w-4" /> Pause Account</>}
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setShowCancelFlow(true)}
                >
                  <X className="h-4 w-4" /> Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Just resumed confirmation */}
        {justResumed && !isPaused && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-6 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <p className="font-bold text-ink">Account resumed successfully</p>
              <p className="text-sm text-muted-foreground">Your AI is back active and answering missed calls.</p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Cancellation flow modal */}
      {showCancelFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <button
              className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-ink transition-colors"
              onClick={() => setShowCancelFlow(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-6 pt-8">
              <CancellationFlow
                onKeep={handleKeep}
                onConfirmCancel={handleConfirmCancel}
                onPause={handlePause}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
