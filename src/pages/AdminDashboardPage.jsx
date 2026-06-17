import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Building2,
  CreditCard,
  Calendar,
  Phone,
  LogOut,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { formatPhone, formatDateTime } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [query, setQuery] = useState("");

  const loadAll = useCallback(async () => {
    // Admin RLS lets these reads return ALL rows across every customer.
    const [companies, profiles, subs, twilio, calendars, appts] = await Promise.all([
      supabase.from("roofing_companies").select("*"),
      supabase.from("profiles").select("id, full_name, phone"),
      supabase.from("subscriptions").select("user_id, status, trial_ends_at, current_period_end"),
      supabase.from("twilio_accounts").select("user_id, phone_number"),
      supabase.from("calendar_connections").select("user_id, google_email"),
      supabase
        .from("appointments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const firstError = [companies, profiles, subs, twilio, calendars, appts].find((r) => r.error);
    if (firstError?.error) {
      toast.error(firstError.error.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Index supporting tables by user_id for an O(1) stitch.
    const profileBy = index(profiles.data, "id");
    const subBy = index(subs.data, "user_id");
    const twilioBy = index(twilio.data, "user_id");
    const calBy = index(calendars.data, "user_id");

    const rows = (companies.data ?? []).map((c) => ({
      ...c,
      profile: profileBy[c.user_id] ?? null,
      subscription: subBy[c.user_id] ?? null,
      twilio: twilioBy[c.user_id] ?? null,
      calendar: calBy[c.user_id] ?? null,
    }));
    // Newest signups first.
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setCustomers(rows);
    setAppointments(appts.data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const filtered = customers.filter((c) => {
    if (!query) return true;
    const hay = [
      c.company_name,
      c.profile?.full_name,
      c.business_phone,
      c.service_area,
      c.twilio?.phone_number,
      c.calendar?.google_email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(query.toLowerCase());
  });

  const stats = {
    customers: customers.length,
    live: customers.filter((c) => c.is_live).length,
    active: customers.filter((c) => ["active", "trialing"].includes(c.subscription?.status)).length,
    appointments: appointments.length,
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-30 border-b border-border bg-white">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Logo />
            </Link>
            <Badge variant="default" className="hidden sm:inline-flex">Admin</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={"h-4 w-4 " + (refreshing ? "animate-spin" : "")} /> Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl space-y-6 py-8">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Admin Overview</h1>
          <p className="text-muted-foreground">All customers and activity across the platform.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Building2} tone="bg-brand-50 text-brand-600" value={stats.customers} label="Total Customers" />
          <StatCard icon={CheckCircle2} tone="bg-emerald-50 text-emerald-600" value={stats.live} label="Live Accounts" />
          <StatCard icon={CreditCard} tone="bg-brand-50 text-brand-600" value={stats.active} label="Active / Trialing" />
          <StatCard icon={Calendar} tone="bg-emerald-50 text-emerald-600" value={stats.appointments} label="Recent Appointments" />
        </div>

        {/* Customers table */}
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between gap-3 border-b border-border p-4">
              <h2 className="font-bold text-ink">Customers</h2>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search customers…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground">No customers found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Company</th>
                      <th className="px-4 py-3 font-medium">Owner</th>
                      <th className="px-4 py-3 font-medium">Number</th>
                      <th className="px-4 py-3 font-medium">Calendar</th>
                      <th className="px-4 py-3 font-medium">Plan</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink">{c.company_name}</p>
                          <p className="text-xs text-muted-foreground">{c.service_area || "—"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-ink">{c.profile?.full_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{c.business_phone || ""}</p>
                        </td>
                        <td className="px-4 py-3">
                          {c.twilio?.phone_number ? (
                            <span className="inline-flex items-center gap-1 text-ink">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              {formatPhone(c.twilio.phone_number)}
                            </span>
                          ) : (
                            <Dash />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {c.calendar?.google_email ? (
                            <span className="truncate text-ink">{c.calendar.google_email}</span>
                          ) : (
                            <Dash />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <SubBadge status={c.subscription?.status} />
                        </td>
                        <td className="px-4 py-3">
                          {c.is_live ? (
                            <Badge variant="success">Live</Badge>
                          ) : (
                            <Badge variant="muted">Step {c.setup_step}/5</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDateTime(c.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent appointments across all customers */}
        <Card>
          <CardContent className="p-0">
            <div className="border-b border-border p-4">
              <h2 className="font-bold text-ink">Recent Appointments (all customers)</h2>
            </div>
            {appointments.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground">No appointments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Lead</th>
                      <th className="px-4 py-3 font-medium">Phone</th>
                      <th className="px-4 py-3 font-medium">Service</th>
                      <th className="px-4 py-3 font-medium">Scheduled</th>
                      <th className="px-4 py-3 font-medium">Booked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr key={a.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                        <td className="px-4 py-3 font-medium text-ink">{a.lead_name || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatPhone(a.lead_phone)}</td>
                        <td className="px-4 py-3">
                          {a.service_type ? (
                            <Badge variant="muted">{a.service_type.replace(/_/g, " ")}</Badge>
                          ) : (
                            <Dash />
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink">{formatDateTime(a.scheduled_time)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDateTime(a.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function index(rows, key) {
  const out = {};
  (rows ?? []).forEach((r) => {
    out[r[key]] = r;
  });
  return out;
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

function SubBadge({ status }) {
  if (!status) return <Badge variant="muted">No plan</Badge>;
  if (status === "active") return <Badge variant="success">Active</Badge>;
  if (status === "trialing") return <Badge variant="default">Trial</Badge>;
  if (status === "canceled" || status === "incomplete")
    return (
      <Badge variant="warning" className="gap-1">
        <XCircle className="h-3 w-3" /> {status}
      </Badge>
    );
  return <Badge variant="muted">{status}</Badge>;
}

function Dash() {
  return <span className="text-muted-foreground">—</span>;
}
