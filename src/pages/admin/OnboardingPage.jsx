import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Loader2, ClipboardCheck, Rocket, MoreVertical, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatusChangeModal } from "@/components/admin/StatusChangeModal";
import { EmptyState } from "@/components/admin/EmptyState";
import { statusLabel } from "@/config/customerStatus";
import {
  PIPELINE,
  daysSince,
  useOnboardingKpis,
  useOnboardingKanban,
  useStalledCustomers,
} from "@/hooks/admin/useOnboarding";

export default function AdminOnboardingPage() {
  const { data: kpi, loading: kpiLoading } = useOnboardingKpis();
  const [refreshKey, setRefreshKey] = useState(0);
  const { rows, truncated, loading } = useOnboardingKanban(refreshKey);
  const { rows: stalled, loading: stalledLoading } = useStalledCustomers(refreshKey);
  const [modal, setModal] = useState(null);

  const byColumn = (status) => rows.filter((r) => r.current_status === status);
  const onSaved = () => setRefreshKey((k) => k + 1);

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Clock} tone="amber" label="Waiting for Info" value={kpi?.waiting} loading={kpiLoading} />
        <StatCard icon={Loader2} tone="brand" label="In Setup" value={kpi?.inSetup} loading={kpiLoading} />
        <StatCard icon={ClipboardCheck} tone="brand" label="Pending Review" value={kpi?.review} loading={kpiLoading} />
        <StatCard icon={Rocket} tone="green" label="Ready to Activate" value={kpi?.ready} loading={kpiLoading} />
      </div>

      {truncated && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4" /> Showing the first 200 onboarding customers. Use the
          Customers page to see the rest.
        </div>
      )}

      {/* Kanban */}
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-5">
          {PIPELINE.map((s) => (
            <div key={s} className="h-64 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          {PIPELINE.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              cards={byColumn(status)}
              onCard={setModal}
            />
          ))}
        </div>
      )}

      {/* Stalled panel */}
      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <div className="border-b border-border px-5 py-3.5">
            <h3 className="text-sm font-bold text-ink">Stalled (7+ days in onboarding)</h3>
          </div>
          <StalledSection loading={stalledLoading} rows={stalled} onCard={setModal} />
        </CardContent>
      </Card>

      {modal && (
        <StatusChangeModal
          open
          customerId={modal.id}
          currentStatus={modal.current_status}
          companyName={modal.company_name}
          onClose={() => setModal(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

function KanbanColumn({ status, cards, onCard }) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/30 p-3">
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {statusLabel(status)}
        </p>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-muted-foreground">
          {cards.length}
        </span>
      </div>
      <div className="space-y-2">
        {cards.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-muted-foreground">Empty</p>
        ) : (
          cards.map((c) => <KanbanCard key={c.id} card={c} onCard={onCard} />)
        )}
      </div>
    </div>
  );
}

function KanbanCard({ card, onCard }) {
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const days = daysSince(card.updated_at);
  return (
    <div className="rounded-xl border border-border bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <button className="min-w-0 text-left" onClick={() => navigate(`/admin/customers/${card.id}`)}>
          <p className="truncate text-sm font-semibold text-ink">{card.company_name}</p>
          <p className="truncate text-xs text-muted-foreground">{card.owner}</p>
        </button>
        <div className="relative">
          <button
            onClick={() => setMenu((v) => !v)}
            onBlur={() => setTimeout(() => setMenu(false), 120)}
            aria-label="Actions"
            className="rounded p-1 text-muted-foreground hover:bg-secondary"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
          {menu && (
            <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-lg border border-border bg-white shadow-lg">
              <button
                onMouseDown={() => navigate(`/admin/customers/${card.id}`)}
                className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-secondary"
              >
                Open detail
              </button>
              <button
                onMouseDown={() => onCard(card)}
                className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-secondary"
              >
                Change status
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {days === 0 ? "today" : `${days}d in status`}
      </p>
    </div>
  );
}

function StalledSection({ loading, rows, onCard }) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-secondary" />
        ))}
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="Nothing stalled"
        description="Every onboarding customer moved within the last week."
      />
    );
  }
  return <StalledTable rows={rows} onCard={onCard} />;
}

function StalledTable({ rows, onCard }) {
  const navigate = useNavigate();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-border">
          <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-5 py-3 font-medium">Company</th>
            <th className="px-5 py-3 font-medium">Owner</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Days stalled</th>
            <th className="px-5 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
              <td className="px-5 py-3 font-medium text-ink">{r.company_name}</td>
              <td className="px-5 py-3 text-muted-foreground">{r.owner}</td>
              <td className="px-5 py-3"><StatusBadge status={r.current_status} /></td>
              <td className="px-5 py-3 font-semibold text-red-600">{daysSince(r.updated_at)}d</td>
              <td className="px-5 py-3 text-right">
                <button onClick={() => navigate(`/admin/customers/${r.id}`)} className="text-xs font-medium text-brand-600 hover:underline">
                  View
                </button>
                <button onClick={() => onCard(r)} className="ml-3 text-xs font-medium text-brand-600 hover:underline">
                  Status
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
