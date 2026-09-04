import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/admin/EmptyState";
import { SideDrawer } from "@/components/admin/SideDrawer";
import { useAuditRequests } from "@/hooks/admin/useAuditRequests";
import { formatDateTime } from "@/lib/utils";

const STATUSES = ["new", "contacted", "qualified", "closed", "spam"];

export default function AuditRequestsPage() {
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState("active");
  const [selected, setSelected] = useState(null);
  const { rows, loading, error, updateStatus } = useAuditRequests();
  const visible = useMemo(() => rows.filter((row) => filter === "all" || (filter === "active" ? !["closed", "spam"].includes(row.status) : row.status === filter)), [rows, filter]);

  useEffect(() => {
    const id = params.get("request");
    if (id && rows.length) setSelected(rows.find((row) => row.id === id) ?? null);
  }, [params, rows]);

  const close = () => { setSelected(null); setParams({}, { replace: true }); };
  const changeStatus = async (id, status) => {
    try {
      await updateStatus(id, status);
      setSelected((row) => row?.id === id ? { ...row, status } : row);
      toast.success("Audit request updated");
    } catch {
      toast.error("Could not update audit request");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["active", "new", "contacted", "qualified", "closed", "spam", "all"].map((value) => (
          <button key={value} onClick={() => setFilter(value)} className={`rounded-full px-3 py-1.5 text-sm font-medium ${filter === value ? "bg-brand-600 text-white" : "bg-secondary text-muted-foreground"}`}>
            {value[0].toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>
      <Card className="rounded-2xl"><CardContent className="p-0">
        {loading ? <div className="p-6 text-sm text-muted-foreground">Loading audit requests…</div> : error ?
          <div className="p-6 text-sm text-red-600">Couldn’t load audit requests.</div> : visible.length === 0 ?
          <EmptyState icon={ClipboardCheck} title="No audit requests" description="No requests match this view." /> :
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="border-b border-border"><tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Received</th><th className="px-4 py-3 font-medium">Company</th><th className="px-4 py-3 font-medium">Contact</th><th className="px-4 py-3 font-medium">Service area</th><th className="px-4 py-3 font-medium">Status</th>
            </tr></thead>
            <tbody>{visible.map((row) => <tr key={row.id} onClick={() => { setSelected(row); setParams({ request: row.id }, { replace: true }); }} className="cursor-pointer border-b border-border/60 hover:bg-secondary/40">
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDateTime(row.created_at)}</td><td className="px-4 py-3 font-medium text-ink">{row.company}</td><td className="px-4 py-3"><div>{row.full_name}</div><div className="text-xs text-muted-foreground">{row.email}</div></td><td className="px-4 py-3 text-muted-foreground">{row.service_area}</td><td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium">{row.status}</span></td>
            </tr>)}</tbody>
          </table></div>}
      </CardContent></Card>
      <SideDrawer open={!!selected} title="Missed Revenue Audit request" onClose={close}>
        {selected && <div className="space-y-5 text-sm">
          <div><label className="mb-1 block text-xs uppercase text-muted-foreground">Status</label><select value={selected.status} onChange={(e) => changeStatus(selected.id, e.target.value)} className="w-full rounded-lg border border-border bg-white px-3 py-2">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <Fields row={selected} />
          <JsonBlock label="Calculator assumptions" value={selected.calculator} />
          <JsonBlock label="Attribution" value={selected.attribution} />
          <p className="text-xs text-muted-foreground">Consent: {selected.consent_version} at {formatDateTime(selected.consented_at)} · marketing {selected.marketing_consent ? "opted in" : "not opted in"}</p>
        </div>}
      </SideDrawer>
    </div>
  );
}

function Fields({ row }) {
  return <dl className="space-y-3">{[
    ["Company", row.company], ["Contact", row.full_name], ["Email", row.email], ["Phone", row.phone || "—"], ["Preferred follow-up", row.preferred_contact], ["Service area", row.service_area], ["Current process", row.current_process || "—"], ["Submission page", row.submission_page || "—"]
  ].map(([label, value]) => <div key={label}><dt className="text-xs uppercase text-muted-foreground">{label}</dt><dd className="break-words text-ink">{value}</dd></div>)}</dl>;
}

function JsonBlock({ label, value }) {
  return <div><p className="mb-1 text-xs uppercase text-muted-foreground">{label}</p><pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-secondary p-3 text-xs">{JSON.stringify(value || {}, null, 2)}</pre></div>;
}
