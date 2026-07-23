import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/admin/EmptyState";
import { SideDrawer } from "@/components/admin/SideDrawer";
import { ChipRow, MultiChips, PaginationBar } from "@/components/admin/ListControls";
import { useActivityLogs } from "@/hooks/admin/useActivityLogs";
import { useLogFilterOptions } from "@/hooks/admin/useLogFilterOptions";
import { RANGE_OPTIONS } from "@/lib/dateRange";
import { formatDateTime } from "@/lib/utils";

const RESULTS = [
  { key: "all", label: "All" },
  { key: "success", label: "Success" },
  { key: "error", label: "Error" },
];
const trunc = (t, n = 80) => (!t ? "" : t.length > n ? t.slice(0, n) + "…" : t);
const detailText = (m) => (m ? m.detail || m.message || JSON.stringify(m) : "");

export default function ActivityPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [actions, setActions] = useState([]);
  const [performedBy, setPerformedBy] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [range, setRange] = useState("7d");
  const [result, setResult] = useState("all");
  const [drawer, setDrawer] = useState(null);

  const { values: actionOptions, admins } = useLogFilterOptions({ table: "activity_logs", column: "action" });
  const { rows, total, loading, error } = useActivityLogs({
    page,
    pageSize,
    actions,
    performedBy,
    customerSearch,
    range,
    result,
  });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const reset = () => setPage(0);
  const toggle = (setter) => (val) => {
    reset();
    setter((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <ChipRow options={RANGE_OPTIONS} value={range} onChange={(k) => { setRange(k); reset(); }} />
            <ChipRow options={RESULTS} value={result} onChange={(k) => { setResult(k); reset(); }} />
            <form
              className="ml-auto"
              onSubmit={(e) => {
                e.preventDefault();
                reset();
                setCustomerSearch(searchInput);
              }}
            >
              <Input
                className="h-9 w-56"
                placeholder="Filter by company…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </form>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Action</p>
              <MultiChips options={actionOptions} selected={actions} onToggle={toggle(setActions)} emptyLabel="No actions yet" />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Performed by</p>
              <MultiChips
                options={admins.map((a) => ({ value: a.id, label: a.name }))}
                selected={performedBy}
                onToggle={toggle(setPerformedBy)}
                emptyLabel="No admins"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-0">
          {loading ? (
            <SkeletonTable />
          ) : error ? (
            <div className="p-6 text-sm text-red-600">Couldn't load activity logs.</div>
          ) : rows.length === 0 ? (
            <EmptyState icon={Activity} title="No activity" description="No log entries match these filters." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">By</th>
                    <th className="px-4 py-3 font-medium">Result</th>
                    <th className="px-4 py-3 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setDrawer(r)}
                      className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-secondary/40"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDateTime(r.created_at)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink">{r.company || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{r.action}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{r.performedByName}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={r.result === "ERROR" ? "text-red-600" : "text-muted-foreground"}>
                          {r.result || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{trunc(detailText(r.metadata), 80)}</td>
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
              onPageSize={(n) => { setPageSize(n); reset(); }}
              noun="events"
            />
          )}
        </CardContent>
      </Card>

      <SideDrawer open={!!drawer} title="Activity detail" onClose={() => setDrawer(null)}>
        {drawer && (
          <div className="space-y-4 text-sm">
            <Field label="Action" value={drawer.action} />
            <Field label="When" value={formatDateTime(drawer.created_at)} />
            <Field label="Performed by" value={drawer.performedByName} />
            <Field label="Result" value={drawer.result || "—"} />
            {drawer.customer_id && (
              <Link to={`/admin/customers/${drawer.customer_id}`} className="inline-block text-brand-600 hover:underline">
                View customer →
              </Link>
            )}
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Metadata</p>
              <pre className="overflow-x-auto rounded-lg bg-secondary/50 p-3 text-xs text-ink">
                {JSON.stringify(drawer.metadata ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </SideDrawer>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-ink">{value}</p>
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
