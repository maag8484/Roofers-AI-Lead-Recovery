import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  User,
  CreditCard,
  Phone,
  Bot,
  Pencil,
  UserX,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OnboardingProgress } from "@/components/admin/OnboardingProgress";
import { CustomerTimeline } from "@/components/admin/CustomerTimeline";

import { useCustomer } from "@/hooks/admin/useCustomer";
import { useLogCustomerView } from "@/hooks/admin/useLogCustomerView";
import { useStatusHistory } from "@/hooks/admin/useStatusHistory";
import { useCustomerActivityLogs } from "@/hooks/admin/useCustomerActivityLogs";
import { useCustomerAuditLogs } from "@/hooks/admin/useCustomerAuditLogs";
import { useAdminNotesAutosave } from "@/hooks/admin/useAdminNotesAutosave";
import { useChangeStatus } from "@/hooks/admin/useChangeStatus";
import { ALL_STATUSES, statusLabel } from "@/config/customerStatus";
import { PLAN_LABEL } from "@/config/plan";
import { formatPhone, formatDateTime } from "@/lib/utils";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, notFound, loading, error, refetch } = useCustomer(id);
  const { change, saving: statusSaving } = useChangeStatus();
  const [historyKey, setHistoryKey] = useState(0);

  // Log VIEWED_CUSTOMER on mount (deduped per (admin, customer) / 5 min).
  useLogCustomerView(id);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (notFound) {
    return (
      <EmptyState
        icon={UserX}
        title="Customer not found"
        description="This customer doesn't exist or was removed."
        action={{ label: "Back to customers", to: "/admin/customers" }}
      />
    );
  }
  if (error || !data) {
    return <div className="p-6 text-sm text-red-600">Couldn't load this customer.</div>;
  }

  const { company: c, profile, subscription, twilio } = data;
  const normalizedStatus = c.current_status?.toUpperCase() ?? "";

  const handleStatusChange = async (newStatus) => {
    const res = await change(c.id, newStatus, null);
    if (res.ok) {
      toast.success(`Status → ${statusLabel(newStatus)}`);
      refetch();
      setHistoryKey((k) => k + 1);
    } else {
      toast.error(res.message || "Could not change status.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/customers"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-ink"
          aria-label="Back to customers"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-ink">{c.company_name}</h1>
          <p className="text-sm text-muted-foreground">Joined {formatDateTime(c.created_at)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Left: read-only info */}
        <div className="space-y-6">
          <InfoCard icon={Building2} title="Business Information">
            <Row label="Company" value={c.company_name} />
            <Row label="Address" value={c.address} />
            <Row label="Business phone" value={formatPhone(c.business_phone)} />
            <Row label="Country code" value={c.phone_country} />
            <Row label="Website" value={c.website} isLink />
          </InfoCard>

          <InfoCard icon={User} title="Owner Information">
            <Row label="Name" value={profile?.full_name} />
            <Row label="Email" value={c.contact_email} />
            <Row label="Phone" value={formatPhone(profile?.phone)} />
          </InfoCard>

          <InfoCard icon={CreditCard} title="Subscription">
            <Row label="Status" value={subscription?.status} />
            <Row label="Plan" value={subscription ? PLAN_LABEL : null} />
            <Row
              label="Current period end"
              value={subscription?.current_period_end ? formatDateTime(subscription.current_period_end) : null}
            />
            <Row
              label="Stripe customer"
              value={
                subscription?.stripe_customer_id
                  ? "…" + subscription.stripe_customer_id.slice(-8)
                  : null
              }
            />
          </InfoCard>

          <InfoCard icon={Phone} title="Business Number">
            <Row label="Number" value={twilio?.phone_number ? formatPhone(twilio.phone_number) : null} />
          </InfoCard>

          <InfoCard icon={Bot} title="AI Configuration Status">
            <p className="text-sm text-muted-foreground">Not tracked.</p>
          </InfoCard>

          <InfoCard icon={User} title="Google Connection">
            <p className="text-sm text-muted-foreground">
              Google integration reserved for future per-customer setup.
            </p>
          </InfoCard>
        </div>

        {/* Right: interactive */}
        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-muted-foreground">Current status</span>
                  <StatusBadge status={normalizedStatus} size="lg" />
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Change status
                </p>
                <Select
                  value={normalizedStatus}
                  onValueChange={handleStatusChange}
                  disabled={statusSaving}
                >
                  <SelectTrigger>
                    {statusSaving
                      ? <span className="flex items-center gap-2"><Spinner className="h-4 w-4" /> Saving…</span>
                      : <SelectValue />
                    }
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} disabled={s === normalizedStatus}>
                        {statusLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <OnboardingProgress status={normalizedStatus} />
            </CardContent>
          </Card>

          <InfoCard icon={CheckCircle2} title="Customer Timeline">
            <CustomerTimeline customer={c} subscription={subscription} refreshKey={historyKey} />
          </InfoCard>

          <AdminNotesCard customerId={c.id} initialNotes={c.admin_notes} />

          <StatusHistoryCard customerId={c.id} refreshKey={historyKey} />
          <RecentLogsCard customerId={c.id} refreshKey={historyKey} />
          <AuditHistoryCard customerId={c.id} refreshKey={historyKey} />
        </div>
      </div>

    </div>
  );
}

function InfoCard({ icon: Icon, title, children }) {
  return (
    <Card className="rounded-2xl">
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

function Row({ label, value, isLink }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      {value ? (
        isLink ? (
          <a href={value} target="_blank" rel="noreferrer" className="break-all text-sm text-brand-600 hover:underline">
            {value}
          </a>
        ) : (
          <p className="break-words text-sm text-ink">{value}</p>
        )
      ) : (
        <p className="text-sm text-muted-foreground">—</p>
      )}
    </div>
  );
}

function AdminNotesCard({ customerId, initialNotes }) {
  const { value, setValue, onBlur, status } = useAdminNotesAutosave(customerId, initialNotes);
  const label = { idle: "", saving: "Saving…", saved: "Saved", error: "Save failed" }[status];
  return (
    <InfoCard icon={Pencil} title="Admin Notes">
      <textarea
        rows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
        placeholder="Internal notes about this customer…"
        className="flex w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1"
      />
      <p className="text-right text-xs text-muted-foreground">{label}</p>
    </InfoCard>
  );
}

function StatusHistoryCard({ customerId, refreshKey }) {
  const { data, loading } = useStatusHistory(customerId, refreshKey);
  return (
    <InfoCard icon={CheckCircle2} title="Status History">
      {loading ? (
        <SkeletonRows />
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No status changes yet.</p>
      ) : (
        <ul className="space-y-3">
          {data.map((h) => (
            <li key={h.id} className="border-b border-border/60 pb-3 text-sm last:border-0 last:pb-0">
              <div className="flex items-center gap-2">
                <StatusBadge status={h.from || undefined} />
                <span className="text-muted-foreground">→</span>
                <StatusBadge status={h.to} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {h.changedBy} · {formatDateTime(h.created_at)}
                {h.note ? ` · ${h.note}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

function RecentLogsCard({ customerId, refreshKey }) {
  const { data, loading } = useCustomerActivityLogs(customerId, refreshKey);
  return (
    <InfoCard icon={Bot} title="Recent Logs">
      {loading ? (
        <SkeletonRows />
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity logged yet.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {data.map((l) => (
            <li key={l.id} className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5">
              <span className="min-w-0 break-all font-medium text-ink">{l.action}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(l.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

function AuditHistoryCard({ customerId, refreshKey }) {
  const { data, loading } = useCustomerAuditLogs(customerId, refreshKey);
  return (
    <InfoCard icon={CheckCircle2} title="Audit History">
      {loading ? (
        <SkeletonRows />
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No audit records yet.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {data.map((a) => (
            <li key={a.id} className="border-b border-border/60 pb-2 last:border-0 last:pb-0">
              <p className="text-ink">
                <span className="font-medium">{a.field}</span>: {a.old_value || "—"} → {a.new_value || "—"}
              </p>
              <p className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-8 animate-pulse rounded-lg bg-secondary" />
      ))}
    </div>
  );
}
