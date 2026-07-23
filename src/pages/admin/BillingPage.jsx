import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Clock, XCircle, DollarSign, MoreVertical, Copy } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/StatCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { ChipRow, PaginationBar } from "@/components/admin/ListControls";
import { useBilling, renewalLabel } from "@/hooks/admin/useBilling";
import { formatDateTime } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "trialing", label: "Trialing" },
  { key: "canceled", label: "Canceled" },
  { key: "past_due", label: "Past Due" },
];

function SubBadge({ status }) {
  if (!status) return <Badge variant="muted">No Subscription</Badge>;
  if (status === "active") return <Badge variant="success">Active</Badge>;
  if (status === "trialing") return <Badge variant="default">Trialing</Badge>;
  if (status === "canceled") return <Badge variant="warning">Canceled</Badge>;
  if (status === "past_due") return <Badge variant="warning">Past Due</Badge>;
  return <Badge variant="muted">{status}</Badge>;
}

export default function AdminBillingPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [filter, setFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const { rows, total, kpis, loading, error } = useBilling({ page, pageSize, filter, search });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={CreditCard} tone="green" label="Active Subscriptions" value={kpis.active} loading={loading} />
        <StatCard icon={Clock} tone="brand" label="Trialing" value={kpis.trialing} loading={loading} />
        <StatCard icon={XCircle} tone="red" label="Canceled (30d)" value={kpis.canceled30} loading={loading} />
        <StatCard icon={DollarSign} tone="green" label="Estimated MRR" value={`$${kpis.mrr.toLocaleString()}`} loading={loading} />
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        MRR is single-plan math ($299 × active). Revisit when plans expand.
      </p>

      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <ChipRow options={FILTERS} value={filter} onChange={(k) => { setFilter(k); setPage(0); }} />
            <form onSubmit={(e) => { e.preventDefault(); setPage(0); setSearch(searchInput); }}>
              <Input
                className="h-9 w-56"
                placeholder="Search company…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </form>
          </div>

          {loading && <SkeletonTable />}
          {!loading && error && <div className="p-6 text-sm text-red-600">Couldn't load billing.</div>}
          {!loading && !error && rows.length === 0 && (
            <EmptyState icon={CreditCard} title="No subscriptions" description="Nothing matches this filter." />
          )}
          {!loading && !error && rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Owner</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Period End</th>
                    <th className="px-4 py-3 font-medium">Renewal</th>
                    <th className="px-4 py-3 font-medium">Stripe ID</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{r.company}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink">{r.owner}</td>
                      <td className="whitespace-nowrap px-4 py-3"><SubBadge status={r.status} /></td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {r.periodEnd ? formatDateTime(r.periodEnd) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{renewalLabel(r.periodEnd)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {r.stripeId ? "…" + r.stripeId.slice(-8) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Kebab
                          onView={() => navigate(`/admin/customers/${r.id}`)}
                          onCopy={r.stripeId ? () => { navigator.clipboard.writeText(r.stripeId); toast.success("Stripe ID copied"); } : null}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && rows.length > 0 && (
            <PaginationBar
              page={page}
              pageCount={pageCount}
              pageSize={pageSize}
              total={total}
              onPage={setPage}
              onPageSize={(n) => { setPageSize(n); setPage(0); }}
              noun="customers"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kebab({ onView, onCopy }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        aria-label="Actions"
        className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-white shadow-lg">
          <button onMouseDown={onView} className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-secondary">
            View customer
          </button>
          {onCopy && (
            <button onMouseDown={onCopy} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-secondary">
              <Copy className="h-3.5 w-3.5" /> Copy Stripe ID
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-secondary" />
      ))}
    </div>
  );
}
