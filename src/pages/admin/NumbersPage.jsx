import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, PhoneOff, CalendarPlus, MoreVertical, Copy } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/admin/StatCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { ChipRow, PaginationBar } from "@/components/admin/ListControls";
import { Badge } from "@/components/ui/badge";
import { useBusinessNumbers } from "@/hooks/admin/useBusinessNumbers";
import { formatPhone, formatDateTime } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "has", label: "Has Number" },
  { key: "missing", label: "Missing Number" },
];

export default function AdminNumbersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [filter, setFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const { rows, total, kpis, loading, error } = useBusinessNumbers({ page, pageSize, filter, search });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Phone} tone="brand" label="Numbers Assigned" value={kpis.assigned} loading={loading} />
        <StatCard icon={PhoneOff} tone="amber" label="Customers Without Number" value={kpis.missing} loading={loading} />
        <StatCard icon={CalendarPlus} tone="green" label="Purchased This Month" value={kpis.thisMonth} loading={loading} />
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <ChipRow options={FILTERS} value={filter} onChange={(k) => { setFilter(k); setPage(0); }} />
            <form onSubmit={(e) => { e.preventDefault(); setPage(0); setSearch(searchInput); }}>
              <Input
                className="h-9 w-56"
                placeholder="Search company or number…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </form>
          </div>

          {loading && <SkeletonTable />}
          {!loading && error && (
            <div className="p-6 text-sm text-red-600">Couldn't load business numbers.</div>
          )}
          {!loading && !error && rows.length === 0 && (
            <EmptyState icon={Phone} title="No customers" description="Nothing matches this filter on this page." />
          )}
          {!loading && !error && rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Owner</th>
                    <th className="px-4 py-3 font-medium">Number</th>
                    <th className="px-4 py-3 font-medium">Country</th>
                    <th className="px-4 py-3 font-medium">Assigned</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{r.company}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink">{r.owner}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {r.number ? formatPhone(r.number) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{r.country}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {r.assignedAt ? formatDateTime(r.assignedAt) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {r.number ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Not Assigned</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <Kebab
                          onView={() => navigate(`/admin/customers/${r.id}`)}
                          onCopy={r.number ? () => { navigator.clipboard.writeText(r.number); toast.success("Number copied"); } : null}
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

      {filter !== "all" && (
        <p className="text-xs text-muted-foreground">
          Number filters apply per page after the customer join; the count above reflects all customers.
        </p>
      )}
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
              <Copy className="h-3.5 w-3.5" /> Copy number
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
