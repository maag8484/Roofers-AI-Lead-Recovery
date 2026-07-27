import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  CreditCard,
  Calendar,
  Phone,
  LogOut,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ClipboardList,
  History,
  LayoutGrid,
  MapPin,
  Mail,
  Link2,
  ArrowRight,
  AlertTriangle,
  User,
  Wrench,
  PhoneForwarded,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { supabase, invokeFunction } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { formatPhone, formatDateTime, cn } from "@/lib/utils";

// Customer status lifecycle the admin drives from the portal.
const STATUSES = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "live", label: "Live" },
  { value: "paused", label: "Paused" },
];
const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.value, s.label]));

const CONVERSION_LABEL = {
  scheduled_appointment: "Scheduled appointment",
  warm_transfer: "Warm transfer",
  take_message: "Take a message",
};

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "audit", label: "Audit", icon: ClipboardList },
  { key: "log", label: "Audit Log", icon: History },
];

export default function AdminDashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [history, setHistory] = useState([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("overview");
  const [selectedId, setSelectedId] = useState(null);
  const [savingStatusId, setSavingStatusId] = useState(null);
  const [reconnectingId, setReconnectingId] = useState(null);

  const loadAll = useCallback(async () => {
    // Admin RLS lets these reads return ALL rows across every customer.
    const [companies, profiles, subs, calendars, appts, hist] = await Promise.all([
      supabase.from("roofing_companies").select("*"),
      supabase.from("profiles").select("id, full_name, phone"),
      supabase.from("subscriptions").select("user_id, status, trial_ends_at, current_period_end"),
      supabase.from("calendar_connections").select("user_id, google_email, expires_at"),
      supabase.from("appointments").select("*").order("created_at", { ascending: false }).limit(50),
      supabase
        .from("status_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    const firstError = [companies, profiles, subs, calendars, appts, hist].find(
      (r) => r.error
    );
    if (firstError?.error) {
      toast.error(firstError.error.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const profileBy = index(profiles.data, "id");
    const subBy = index(subs.data, "user_id");
    const calBy = index(calendars.data, "user_id");

    const rows = (companies.data ?? []).map((c) => ({
      ...c,
      profile: profileBy[c.user_id] ?? null,
      subscription: subBy[c.user_id] ?? null,
      calendar: calBy[c.user_id] ?? null,
    }));
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setCustomers(rows);
    setAppointments(appts.data ?? []);
    setHistory(hist.data ?? []);
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

  // Update a customer's status + record an audit-log entry. RLS grants admins
  // UPDATE on roofing_companies.status and INSERT on status_history. An optional
  // note captures *why* the change was made.
  const updateStatus = async (customer, nextStatus, note) => {
    if (nextStatus === customer.status) return;
    setSavingStatusId(customer.id);

    const { error: upErr } = await supabase
      .from("roofing_companies")
      .update({ status: nextStatus })
      .eq("id", customer.id);

    if (upErr) {
      toast.error(upErr.message);
      setSavingStatusId(null);
      return;
    }

    const trimmedNote = note?.trim() || null;

    // Best-effort audit entry. If it fails we still keep the status change.
    const { error: histErr } = await supabase.from("status_history").insert({
      company_id: customer.id,
      user_id: customer.user_id,
      from_status: customer.status,
      to_status: nextStatus,
      changed_by: user?.id ?? null,
      note: trimmedNote,
    });
    if (histErr) console.error("[admin] audit log insert failed", histErr.message);

    // Reflect locally without a full reload.
    setCustomers((prev) =>
      prev.map((c) => (c.id === customer.id ? { ...c, status: nextStatus } : c))
    );
    setHistory((prev) => [
      {
        id: `local-${customer.id}-${nextStatus}`,
        company_id: customer.id,
        user_id: customer.user_id,
        from_status: customer.status,
        to_status: nextStatus,
        changed_by: user?.id ?? null,
        note: trimmedNote,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    setSavingStatusId(null);
    toast.success(`Status → ${STATUS_LABEL[nextStatus]}`);
  };

  // Admin connects Google Calendar on the customer's behalf. The edge function
  // verifies the caller is an admin and stores the connection against the
  // customer's user_id (target_user_id), then Google redirects back to /admin.
  const reconnectGoogle = async (customer) => {
    setReconnectingId(customer.id);
    try {
      const res = await invokeFunction("google-oauth-start", {
        redirect_to: `${window.location.origin}/admin`,
        target_user_id: customer.user_id,
      });
      if (res?.url) window.location.href = res.url;
      else throw new Error("No OAuth URL returned.");
    } catch (err) {
      console.error(err);
      toast.error("Could not start Google reconnect. Is google-oauth-start deployed?");
      setReconnectingId(null);
    }
  };

  const filtered = customers.filter((c) => {
    if (!query) return true;
    const hay = [
      c.company_name,
      c.profile?.full_name,
      c.business_phone,
      c.service_area,
      c.service_areas,
      c.calendar?.google_email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(query.toLowerCase());
  });

  const stats = {
    customers: customers.length,
    live: customers.filter((c) => c.status === "live").length,
    active: customers.filter((c) => ["active", "trialing"].includes(c.subscription?.status)).length,
    appointments: appointments.length,
  };

  const customerById = (id) => customers.find((c) => c.id === id) ?? null;
  const openAudit = (id) => {
    setSelectedId(id);
    setTab("audit");
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

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                tab === t.key
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-muted-foreground hover:text-ink"
              )}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <OverviewTab
            filtered={filtered}
            query={query}
            setQuery={setQuery}
            savingStatusId={savingStatusId}
            reconnectingId={reconnectingId}
            onStatusChange={updateStatus}
            onReconnect={reconnectGoogle}
            onOpenAudit={openAudit}
          />
        )}

        {tab === "audit" && (
          <AuditTab
            customers={customers}
            selected={customerById(selectedId)}
            onSelect={setSelectedId}
            reconnectingId={reconnectingId}
            onReconnect={reconnectGoogle}
          />
        )}

        {tab === "log" && <AuditLogTab history={history} customers={customers} />}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview tab: customer table with inline status control + Google reconnect.
// ---------------------------------------------------------------------------
function OverviewTab({
  filtered,
  query,
  setQuery,
  savingStatusId,
  reconnectingId,
  onStatusChange,
  onReconnect,
  onOpenAudit,
}) {
  return (
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
                  <th className="px-4 py-3 font-medium">Google</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{c.company_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.service_areas || c.service_area || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <GoogleCell
                        customer={c}
                        reconnecting={reconnectingId === c.id}
                        onReconnect={() => onReconnect(c)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <SubBadge status={c.subscription?.status} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusCell
                        customer={c}
                        saving={savingStatusId === c.id}
                        onChange={onStatusChange}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => onOpenAudit(c.id)}>
                        View <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Audit tab: full submitted details for one selected customer.
// ---------------------------------------------------------------------------
function AuditTab({ customers, selected, onSelect, reconnectingId, onReconnect }) {
  if (customers.length === 0) {
    return <p className="p-8 text-center text-muted-foreground">No customers yet.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Customer picker */}
      <Card>
        <CardContent className="p-2">
          <ul className="space-y-1">
            {customers.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => onSelect(c.id)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    selected?.id === c.id
                      ? "bg-brand-50 font-medium text-brand-700"
                      : "hover:bg-secondary"
                  )}
                >
                  <span className="block truncate">{c.company_name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {STATUS_LABEL[c.status] ?? "New"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Detail panel */}
      {!selected ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            Select a customer to view their submitted details.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-ink">{selected.company_name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selected.profile?.full_name || "—"} · joined{" "}
                  {formatDateTime(selected.created_at)}
                </p>
              </div>
              <Badge variant={selected.status === "live" ? "success" : "muted"}>
                {STATUS_LABEL[selected.status] ?? "New"}
              </Badge>
            </div>

            {!selected.details_submitted && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                <AlertTriangle className="h-4 w-4" /> This customer hasn't submitted the onboarding
                form yet.
              </div>
            )}

            <DetailSection icon={Building2} title="Business Information">
              <Detail icon={Building2} label="Business name" value={selected.company_name} />
              <Detail icon={Phone} label="Business phone" value={formatPhone(selected.business_phone)} />
              <Detail icon={MapPin} label="Address" value={selected.address} />
              <Detail icon={User} label="Primary contact" value={selected.contact_name} />
              <Detail icon={Mail} label="Contact email" value={selected.contact_email} />
            </DetailSection>

            <DetailSection icon={Wrench} title="Service Details">
              <Detail icon={MapPin} label="Service area" value={selected.service_areas} />
              <Detail icon={ClipboardList} label="Services offered" value={selected.services} />
            </DetailSection>

            <DetailSection icon={PhoneForwarded} title="Call Handling">
              <Detail
                icon={ArrowRight}
                label="Conversion goal"
                value={CONVERSION_LABEL[selected.conversion_preference] ?? selected.conversion_preference}
              />
              {selected.conversion_preference === "scheduled_appointment" && (
                <Detail icon={Link2} label="Scheduling link" value={selected.calendly_link} isLink />
              )}
              {selected.conversion_preference === "warm_transfer" && (
                <Detail
                  icon={PhoneForwarded}
                  label="Transfer number"
                  value={formatPhone(selected.transfer_number)}
                />
              )}
            </DetailSection>

            <DetailSection icon={Clock} title="Hours of Operation">
              <Detail icon={Clock} label="Business hours" value={selected.business_hours} />
              <Detail
                icon={Clock}
                label="After-hours preference"
                value={selected.after_hours_preference}
              />
            </DetailSection>

            <DetailSection icon={Mail} title="Integrations">
              <Detail icon={Mail} label="Google calendar" value={selected.calendar?.google_email} />
            </DetailSection>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
              <GoogleCell customer={selected} reconnecting={reconnectingId === selected.id} onReconnect={() => onReconnect(selected)} withLabel />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audit Log tab: chronological status-change history across all customers.
// ---------------------------------------------------------------------------
function AuditLogTab({ history, customers }) {
  const nameByCompany = Object.fromEntries(customers.map((c) => [c.id, c.company_name]));

  return (
    <Card>
      <CardContent className="p-0">
        <div className="border-b border-border p-4">
          <h2 className="font-bold text-ink">Status Change Log</h2>
          <p className="text-sm text-muted-foreground">Every status change, newest first.</p>
        </div>
        {history.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">No status changes recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Change</th>
                  <th className="px-4 py-3 font-medium">Note</th>
                  <th className="px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                    <td className="px-4 py-3 font-medium text-ink">
                      {nameByCompany[h.company_id] ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        {h.from_status ? (
                          <Badge variant="muted">{STATUS_LABEL[h.from_status] ?? h.from_status}</Badge>
                        ) : (
                          <Badge variant="muted">—</Badge>
                        )}
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <Badge variant={h.to_status === "live" ? "success" : "default"}>
                          {STATUS_LABEL[h.to_status] ?? h.to_status}
                        </Badge>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {h.note ? <span className="text-ink">{h.note}</span> : <Dash />}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(h.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------
// Status dropdown + an optional note field. The note is applied to the audit
// entry on the next status change, then cleared.
function StatusCell({ customer, saving, onChange }) {
  const [note, setNote] = useState("");

  const handleChange = async (next) => {
    await onChange(customer, next, note);
    setNote("");
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Select value={customer.status ?? "new"} onValueChange={handleChange} disabled={saving}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {saving && <Spinner className="h-4 w-4" />}
      </div>
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        className="h-8 w-36 text-xs"
      />
    </div>
  );
}

function GoogleCell({ customer, reconnecting, onReconnect, withLabel }) {
  const email = customer.calendar?.google_email;
  const expiresAt = customer.calendar?.expires_at;
  const expired = expiresAt ? new Date(expiresAt) < new Date() : false;

  let state = "none";
  if (email && !expired) state = "connected";
  else if (email && expired) state = "expired";

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0">
        {withLabel && <p className="text-sm font-medium text-ink">Google Calendar</p>}
        {state === "connected" && (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="truncate text-xs">{email}</span>
          </span>
        )}
        {state === "expired" && (
          <span className="inline-flex items-center gap-1 text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="truncate text-xs">Expired</span>
          </span>
        )}
        {state === "none" && <span className="text-xs text-muted-foreground">Not connected</span>}
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={onReconnect}
        disabled={reconnecting}
        className="h-8 shrink-0"
      >
        {reconnecting ? (
          <Spinner className="h-3.5 w-3.5" />
        ) : (
          <>
            <RefreshCw className="h-3.5 w-3.5" /> {state === "none" ? "Connect" : "Reconnect"}
          </>
        )}
      </Button>
    </div>
  );
}

function DetailSection({ icon: Icon, title, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <Icon className="h-4 w-4 text-brand-600" />
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
      </div>
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>
    </div>
  );
}

function Detail({ icon: Icon, label, value, isLink }) {
  let rendered;
  if (!value) {
    rendered = <span className="text-muted-foreground">—</span>;
  } else if (isLink) {
    rendered = (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="break-all text-brand-600 hover:underline"
      >
        {value}
      </a>
    );
  } else {
    rendered = <span className="break-words">{value}</span>;
  }

  return (
    <div className="flex gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
        <dd className="text-sm text-ink">{rendered}</dd>
      </div>
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
