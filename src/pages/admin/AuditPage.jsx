import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Copy } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/admin/EmptyState";
import { SideDrawer } from "@/components/admin/SideDrawer";
import { ChipRow, MultiChips, PaginationBar } from "@/components/admin/ListControls";
import { useAuditLogs } from "@/hooks/admin/useAuditLogs";
import { useLogFilterOptions } from "@/hooks/admin/useLogFilterOptions";
import { RANGE_OPTIONS } from "@/lib/dateRange";
import { formatDateTime } from "@/lib/utils";

const trunc = (t, n = 60) => (!t ? "—" : t.length > n ? t.slice(0, n) + "…" : t);

export default function AuditPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [entityTypes, setEntityTypes] = useState([]);
  const [actors, setActors] = useState([]);
  const [fieldSearch, setFieldSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [range, setRange] = useState("7d");
  const [drawer, setDrawer] = useState(null);

  const { values: entityOptions, admins } = useLogFilterOptions({ table: "audit_logs", column: "entity_type" });
  const { rows, total, loading, error } = useAuditLogs({ page, pageSize, entityTypes, actors, fieldSearch, range });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const reset = () => setPage(0);
  const toggle = (setter) => (val) => {
    reset();
    setter((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
  };
  const copyId = (id) => {
    navigator.clipboard.writeText(id);
    toast.success("Entity ID copied");
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <ChipRow options={RANGE_OPTIONS} value={range} onChange={(k) => { setRange(k); reset(); }} />
            <form
              className="ml-auto"
              onSubmit={(e) => { e.preventDefault(); reset(); setFieldSearch(searchInput); }}
            >
              <Input
                className="h-9 w-56"
                placeholder="Filter by field…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </form>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Entity type</p>
              <MultiChips options={entityOptions} selected={entityTypes} onToggle={toggle(setEntityTypes)} emptyLabel="No entities yet" />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Actor</p>
              <MultiChips
                options={admins.map((a) => ({ value: a.id, label: a.name }))}
                selected={actors}
                onToggle={toggle(setActors)}
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
            <div className="p-6 text-sm text-red-600">Couldn't load audit logs.</div>
          ) : rows.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No audit records" description="No entries match these filters." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">Actor</th>
                    <th className="px-4 py-3 font-medium">Entity</th>
                    <th className="px-4 py-3 font-medium">Entity ID</th>
                    <th className="px-4 py-3 font-medium">Field</th>
                    <th className="px-4 py-3 font-medium">Old</th>
                    <th className="px-4 py-3 font-medium">New</th>
                    <th className="px-4 py-3 font-medium">IP</th>
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
                      <td className="whitespace-nowrap px-4 py-3 text-ink">{r.actorName}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{r.entity_type}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          {String(r.entity_id).slice(0, 8)}…
                          <button
                            onClick={(e) => { e.stopPropagation(); copyId(r.entity_id); }}
                            className="rounded p-0.5 hover:bg-secondary"
                            aria-label="Copy full entity id"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{r.field || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{trunc(r.old_value, 60)}</td>
                      <td className="px-4 py-3 text-ink">{trunc(r.new_value, 60)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{r.ip_address || "—"}</td>
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
              noun="records"
            />
          )}
        </CardContent>
      </Card>

      <SideDrawer open={!!drawer} title="Audit detail" onClose={() => setDrawer(null)}>
        {drawer && (
          <div className="space-y-4 text-sm">
            <Field label="Actor" value={drawer.actorName} />
            <Field label="When" value={formatDateTime(drawer.created_at)} />
            <Field label="Entity" value={`${drawer.entity_type} · ${drawer.entity_id}`} />
            <Field label="Field" value={drawer.field || "—"} />
            <Field label="IP" value={drawer.ip_address || "—"} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Old value</p>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  {drawer.old_value ?? "—"}
                </pre>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">New value</p>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  {drawer.new_value ?? "—"}
                </pre>
              </div>
            </div>

            {drawer.entity_type === "roofing_companies" && (
              <Link to={`/admin/customers/${drawer.entity_id}`} className="inline-block text-brand-600 hover:underline">
                View affected customer →
              </Link>
            )}
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
      <p className="break-words text-ink">{value}</p>
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
