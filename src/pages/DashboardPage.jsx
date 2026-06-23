import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Phone,
  Calendar,
  Users,
  Clock,
  Check,
  LogOut,
  Settings,
  CreditCard,
  Copy,
  ArrowRight,
  Rocket,
  MapPin,
  Shield,
  PartyPopper,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase, invokeFunction } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatPhone, formatDateTime } from "@/lib/utils";

export default function DashboardPage() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [twilio, setTwilio] = useState(null);
  const [calendar, setCalendar] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ booked: 0, leads: 0, avgResponse: null });

  const loadData = useCallback(async () => {
    if (!user) return;
    const [tw, cal, sub, appts, leads] = await Promise.all([
      supabase.from("twilio_accounts").select("phone_number").eq("user_id", user.id).maybeSingle(),
      supabase.from("calendar_connections").select("google_email").eq("user_id", user.id).maybeSingle(),
      supabase.from("subscriptions").select("status, trial_ends_at").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .gte("scheduled_time", new Date().toISOString())
        .order("scheduled_time", { ascending: true })
        .limit(20),
      supabase.from("recovered_leads").select("response_seconds").eq("user_id", user.id),
    ]);

    setTwilio(tw.data);
    setCalendar(cal.data);
    setSubscription(sub.data);
    setAppointments(appts.data ?? []);

    const leadRows = leads.data ?? [];
    const responded = leadRows.filter((l) => l.response_seconds != null);
    const avg = responded.length
      ? Math.round(responded.reduce((s, l) => s + l.response_seconds, 0) / responded.length)
      : null;
    setStats({
      booked: appts.data?.length ?? 0,
      leads: leadRows.length,
      avgResponse: avg,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setShowPaymentSuccess(true);
      // Clean the URL without reload
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams]);

  // Realtime: new appointments stream straight into the list.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("appointments-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "appointments", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setAppointments((prev) =>
            [...prev, payload.new].sort(
              (a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time)
            )
          );
          setStats((s) => ({ ...s, booked: s.booked + 1 }));
          toast.success(`New appointment: ${payload.new.lead_name || "lead"}`);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const startCheckout = async () => {
    try {
      const res = await invokeFunction("stripe-create-checkout", {
        success_url: `${window.location.origin}/dashboard?payment=success`,
        cancel_url: `${window.location.origin}/dashboard`,
      });
      if (res?.url) window.location.href = res.url;
      else throw new Error(res?.error ?? "No checkout URL returned.");
    } catch (err) {
      console.error(err);
      toast.error("Could not start checkout. Please try again.");
    }
  };

  const copyNumber = () => {
    if (!twilio?.phone_number) return;
    navigator.clipboard.writeText(twilio.phone_number);
    toast.success("Number copied to clipboard");
  };

  const setupComplete = Boolean(twilio && calendar);

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
              Complete your setup below to start recovering missed calls automatically.
            </p>
            <Button className="w-full" onClick={() => setShowPaymentSuccess(false)}>
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-white">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/dashboard">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="secondary" size="sm" asChild>
                <Link to="/admin">
                  <Shield className="h-4 w-4" /> Admin
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl space-y-6 py-8">
        {/* Greeting */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-ink">
              Welcome, {profile?.company_name || profileName(profile) || "there"}!
            </h1>
            <p className="text-muted-foreground">Here's what's happening with your leads.</p>
          </div>
          {profile?.is_live ? (
            <Badge variant="success" className="py-1.5 text-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Live
            </Badge>
          ) : (
            <Badge variant="warning" className="py-1.5 text-sm">
              Setup incomplete
            </Badge>
          )}
        </div>

        {/* Setup status / Go Live */}
        {!profile?.is_live && (
          <Card className="border-brand-200 bg-brand-50/40">
            <CardContent className="p-6">
              <h2 className="mb-4 font-bold text-ink">Finish your setup</h2>
              <div className="space-y-2.5">
                <SetupRow done label="Account created" />
                <SetupRow
                  done={!!subscription}
                  label="Payment processed ($299/month)"
                  onAction={!subscription ? startCheckout : undefined}
                />
                <SetupRow
                  done={!!twilio}
                  label={twilio ? `Twilio number: ${formatPhone(twilio.phone_number)}` : "Purchase Twilio number"}
                  to="/setup/twilio"
                />
                <SetupRow
                  done={!!calendar}
                  label={calendar ? `Calendar connected: ${calendar.google_email}` : "Connect Google Calendar"}
                  to="/setup/calendar"
                />
              </div>
              {!setupComplete && (
                <Button className="mt-5" asChild>
                  <Link to={!twilio ? "/setup/twilio" : "/setup/calendar"}>
                    Continue Setup <ArrowRight />
                  </Link>
                </Button>
              )}
              {setupComplete && !profile?.is_live && (
                <Button className="mt-5" asChild>
                  <Link to="/setup/calendar">
                    <Rocket className="h-4 w-4" /> Go Live
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Users} tone="bg-brand-50 text-brand-600" value={stats.leads} label="Leads Recovered" />
          <StatCard icon={Phone} tone="bg-brand-50 text-brand-600" value={stats.leads} label="Missed Calls Responded" />
          <StatCard icon={Calendar} tone="bg-emerald-50 text-emerald-600" value={stats.booked} label="Estimates Booked" />
          <StatCard
            icon={Clock}
            tone="bg-brand-50 text-brand-600"
            value={stats.avgResponse != null ? `${stats.avgResponse}s` : "—"}
            label="Avg Response Time"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Upcoming appointments */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <h2 className="mb-4 font-bold text-ink">Upcoming Appointments</h2>
              {appointments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-12 text-center">
                  <Calendar className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    None yet — they'll appear here in real time as leads come in.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {appointments.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-start justify-between gap-4 rounded-xl border border-border p-4"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{a.lead_name || "New lead"}</p>
                        <p className="text-sm text-muted-foreground">{formatPhone(a.lead_phone)}</p>
                        {a.property_address && (
                          <p className="mt-1 flex items-center gap-1 truncate text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" /> {a.property_address}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-brand-600">
                          {formatDateTime(a.scheduled_time)}
                        </p>
                        {a.service_type && (
                          <Badge variant="muted" className="mt-1.5">
                            {a.service_type.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Side panel */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">Your Business Number</p>
                {twilio ? (
                  <>
                    <p className="mt-1 text-xl font-extrabold text-ink">
                      {formatPhone(twilio.phone_number)}
                    </p>
                    <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={copyNumber}>
                      <Copy className="h-4 w-4" /> Copy number
                    </Button>
                  </>
                ) : (
                  <Button size="sm" className="mt-3 w-full" asChild>
                    <Link to="/setup/twilio">Get a number</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">Calendar Status</p>
                {calendar ? (
                  <p className="mt-1 flex items-center gap-1.5 font-semibold text-emerald-600">
                    <Check className="h-4 w-4" /> {calendar.google_email}
                  </p>
                ) : (
                  <Button size="sm" className="mt-3 w-full" asChild>
                    <Link to="/setup/calendar">Connect calendar</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-2 p-6">
                <p className="mb-1 text-sm font-medium text-muted-foreground">Settings</p>
                <SettingsLink icon={Settings} to="/setup/calendar" label="Edit availability" />
                <SettingsLink icon={Phone} to="/setup/twilio" label="Phone number" />
                <SettingsLink icon={CreditCard} to="/billing" label="Billing" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function profileName(profile) {
  return null; // company_name is the primary display; placeholder for future owner name
}

function StatCard({ icon: Icon, tone, value, label }) {
  return (
    <Card>
      <CardContent className="p-5">
        <span className={"mb-3 flex h-10 w-10 items-center justify-center rounded-lg " + tone}>
          <Icon className="h-5 w-5" />
        </span>
        <p className="text-3xl font-extrabold text-ink">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function SetupRow({ done, label, to, onAction }) {
  const content = (
    <div className="flex items-center gap-3">
      <span
        className={
          "flex h-6 w-6 items-center justify-center rounded-full " +
          (done ? "bg-emerald-500 text-white" : "border-2 border-border bg-white")
        }
      >
        {done && <Check className="h-3.5 w-3.5" />}
      </span>
      <span className={done ? "text-ink" : "font-medium text-brand-600"}>{label}</span>
    </div>
  );
  if (!done && onAction) return <button onClick={onAction} className="block w-full text-left hover:opacity-80">{content}</button>;
  if (!done && to) return <Link to={to} className="block hover:opacity-80">{content}</Link>;
  return content;
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
