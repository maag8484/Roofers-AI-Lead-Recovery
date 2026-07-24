import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Wrench,
  Clock,
  LifeBuoy,
  Activity,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { AccountMenu } from "@/components/AccountMenu";
import { formatPhone, formatDateTime } from "@/lib/utils";

const CONVERSION_LABEL = {
  scheduled_appointment: "Scheduled appointment",
  warm_transfer: "Warm transfer",
  take_message: "Take a message",
};

const SUB_LABEL = {
  active: "Active",
  trialing: "Trial",
  canceled: "Canceled",
  incomplete: "Incomplete",
  past_due: "Past due",
};

export default function AccountPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("subscriptions")
        .select("status, trial_ends_at, current_period_end, stripe_customer_id, created_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("status_history")
        .select("from_status, to_status, note, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
    ]).then(([sub, hist]) => {
      setSubscription(sub.data ?? null);
      setHistory(hist.data ?? []);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const fullName = user?.user_metadata?.full_name || profile?.contact_name || "—";
  const status = profile?.status ?? "new";
  const paid = ["active", "trialing"].includes(subscription?.status);
  const trialing = subscription?.status === "trialing";

  // Onboarding progress from the real lifecycle.
  const progressSteps = [
    { label: "Account created", done: true },
    { label: "Payment completed", done: paid },
    { label: "Business information submitted", done: !!profile?.details_submitted },
    { label: "Configuration in progress", done: status === "live", active: status === "in_progress" },
    { label: "AI activated", done: status === "live" },
  ];
  const completed = progressSteps.filter((s) => s.done).length;
  const pct = Math.round((completed / progressSteps.length) * 100);

  const renewal = subscription?.current_period_end
    ? formatDateTime(subscription.current_period_end)
    : trialing && subscription?.trial_ends_at
    ? formatDateTime(subscription.trial_ends_at)
    : "—";

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-30 border-b border-border bg-white">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-ink"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link to="/" aria-label="Roof AI Lead Recovery home">
              <Logo />
            </Link>
          </div>
          <AccountMenu />
        </div>
      </header>

      <main className="container max-w-4xl space-y-6 py-8">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Account Overview</h1>
          <p className="text-muted-foreground">Everything about your account in one place.</p>
        </div>

        {/* Onboarding progress */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-ink">Onboarding Status</h2>
              <span className="text-sm font-semibold text-brand-600">{pct}% complete</span>
            </div>
            <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-brand-600 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <ul className="space-y-2.5">
              {progressSteps.map((s) => (
                <li key={s.label} className="flex items-center gap-3 text-sm">
                  {s.done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : s.active ? (
                    <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
                  ) : (
                    <span className="h-5 w-5 rounded-full border-2 border-border" />
                  )}
                  <span className={s.done ? "text-ink" : s.active ? "font-medium text-brand-700" : "text-muted-foreground"}>
                    {s.label}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Account Information */}
          <Section title="Account Information" icon={User}>
            <Row icon={User} label="Name" value={fullName} />
            <Row icon={Mail} label="Email" value={user?.email} />
            <Row icon={Building2} label="Company" value={profile?.company_name} />
            <Row icon={Phone} label="Business phone" value={formatPhone(profile?.business_phone)} />
            {profile?.phone_country && (
              <Row icon={MapPin} label="Country" value={profile.phone_country} />
            )}
            <Row icon={MapPin} label="Address" value={profile?.address} />
            {subscription?.created_at && (
              <Row icon={Clock} label="Created" value={formatDateTime(subscription.created_at)} />
            )}
          </Section>

          {/* Subscription */}
          <Section title="Subscription" icon={CreditCard}>
            <Row icon={CreditCard} label="Plan" value="Roof AI Lead Recovery · $299/mo" />
            <Row
              icon={Activity}
              label="Status"
              value={
                <Badge variant={paid ? "success" : "muted"}>
                  {SUB_LABEL[subscription?.status] ?? subscription?.status ?? "No plan"}
                </Badge>
              }
            />
            {trialing && (
              <Row
                icon={Clock}
                label="Trial ends"
                value={formatDateTime(subscription?.trial_ends_at)}
              />
            )}
            <Row icon={Clock} label="Renewal" value={renewal} />
            <div className="pt-1">
              <Button variant="secondary" size="sm" asChild>
                <Link to="/billing">
                  Manage subscription <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </Section>

          {/* Business Details */}
          <Section title="Business Details" icon={Wrench}>
            <Row icon={Building2} label="Business name" value={profile?.company_name} />
            <Row icon={MapPin} label="Service area" value={profile?.service_areas} />
            <Row icon={Wrench} label="Services" value={profile?.services} />
            <Row
              icon={Phone}
              label="Conversion goal"
              value={CONVERSION_LABEL[profile?.conversion_preference] ?? profile?.conversion_preference}
            />
            <Row icon={Clock} label="Business hours" value={profile?.business_hours} />
            <Row icon={Clock} label="After hours" value={profile?.after_hours_preference} />
          </Section>

          {/* Support */}
          <Section title="Support" icon={LifeBuoy}>
            <p className="text-sm text-muted-foreground">
              Need a hand? Our team is here to help you get the most out of Roof AI.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Button variant="secondary" size="sm" asChild>
                <a href="mailto:support@roofaileadrecovery.com">
                  <Mail className="h-4 w-4" /> Contact support
                </a>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4" /> Back to dashboard
              </Button>
            </div>
          </Section>
        </div>

        {/* Recent Activity */}
        <Section title="Recent Activity" icon={Activity} full>
          <ul className="space-y-3">
            <ActivityItem label="Account created" when={subscription?.created_at} />
            {paid && <ActivityItem label="Payment completed" when={subscription?.created_at} />}
            {profile?.details_submitted && (
              <ActivityItem label="Business information submitted" when={null} />
            )}
            {history.map((h, i) => (
              <ActivityItem
                key={i}
                label={`Status changed to "${(h.to_status || "").replace(/_/g, " ")}"${h.note ? ` — ${h.note}` : ""}`}
                when={h.created_at}
              />
            ))}
          </ul>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, icon: Icon, children, full }) {
  return (
    <Card className={full ? "md:col-span-2" : ""}>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
            <Icon className="h-4 w-4 text-brand-600" />
          </span>
          <h2 className="font-bold text-ink">{title}</h2>
        </div>
        <div className="space-y-3">{children}</div>
      </CardContent>
    </Card>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="text-sm text-ink">
          {value ? (
            typeof value === "string" ? (
              <span className="break-words">{value}</span>
            ) : (
              value
            )
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ label, when }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <span className="flex min-w-0 items-center gap-2.5 text-sm text-ink">
        <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" /> {label}
      </span>
      {when && <span className="text-xs text-muted-foreground">{formatDateTime(when)}</span>}
    </li>
  );
}
