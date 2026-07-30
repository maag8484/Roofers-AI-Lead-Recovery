import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CreditCard, LogOut, ChevronLeft, CheckCircle2, AlertCircle, Clock, Pause, X } from "lucide-react";
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

  // cancellation flow modal
  const [showCancelFlow, setShowCancelFlow] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);
  const [pauseDone, setPauseDone] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("subscriptions")
      .select("status, trial_ends_at, current_period_end, stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setSubscription(data ?? null);
        setLoading(false);
      });
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
      const res = await invokeFunction("stripe-billing-portal", {
        return_url: window.location.href,
      });
      if (res?.url) {
        window.location.href = res.url;
      } else {
        throw new Error(res?.error ?? "No portal URL returned.");
      }
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

  // Retention flow handlers
  const handleKeep = () => {
    setShowCancelFlow(false);
    toast.success("Great! Your account is still active.");
  };

  const handleConfirmCancel = () => {
    setShowCancelFlow(false);
    setCancelDone(true);
    // Redirect to Stripe portal to complete cancellation
    openPortal();
  };

  const handlePause = () => {
    setShowCancelFlow(false);
    setPauseDone(true);
    // For now, email support to trigger pause — Stripe pause can be wired later
    toast.success("Pause request sent! Our team will pause your account within 24 hours.");
    window.location.href = "mailto:support@roofaileadrecovery.com?subject=Account Pause Request&body=Please pause my account for 60 days. My email is: " + user?.email;
  };

  const statusInfo = (status) => {
    if (status === "active")   return { label: "Active",   icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" };
    if (status === "trialing") return { label: "Trial",    icon: Clock,        color: "text-brand-600",   bg: "bg-brand-50"   };
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

        {/* Current plan */}
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
                {redirecting ? (
                  <Spinner className="text-white" />
                ) : (
                  <><CreditCard className="h-4 w-4" /> Manage Subscription & Billing</>
                )}
              </Button>
            )}

            <p className="text-xs text-center text-muted-foreground">
              You'll be redirected to Stripe's secure billing portal to update your card or view invoices.
            </p>
          </CardContent>
        </Card>

        {/* Cancel / Pause section — only show for active subs */}
        {isActive && !cancelDone && !pauseDone && (
          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="font-bold text-ink">Account Actions</h2>
              <p className="text-sm text-muted-foreground">
                Need a break or want to cancel? We have options that may work better than cancelling outright.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={handlePause}
                >
                  <Pause className="h-4 w-4" /> Pause Account
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

        {pauseDone && (
          <Card>
            <CardContent className="p-6 text-center space-y-2">
              <Pause className="h-8 w-8 text-brand-600 mx-auto" />
              <p className="font-bold text-ink">Pause request received</p>
              <p className="text-sm text-muted-foreground">Our team will pause your account within 24 hours. You'll get a confirmation email.</p>
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
