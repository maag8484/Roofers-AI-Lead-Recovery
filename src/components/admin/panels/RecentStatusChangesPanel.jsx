import { GitBranch, ArrowRight } from "lucide-react";
import { useRecentStatusChanges } from "@/hooks/admin/useRecentStatusChanges";
import { PanelShell, truncate } from "./PanelShell";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

const TH = "px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground";
const TD = "px-5 py-2.5 text-sm";

export function RecentStatusChangesPanel() {
  const { data, loading, error } = useRecentStatusChanges();
  return (
    <PanelShell
      title="Recent Status Changes"
      loading={loading}
      error={error}
      empty={data.length === 0}
      emptyIcon={GitBranch}
      emptyText="No status changes yet."
    >
      <table className="w-full">
        <thead className="border-b border-border">
          <tr>
            <th className={TH}>Company</th>
            <th className={TH}>Change</th>
            <th className={TH}>By</th>
            <th className={TH}>Note</th>
            <th className={TH}>When</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
              <td className={TD + " font-medium text-ink"}>{r.company}</td>
              <td className={TD}>
                <span className="inline-flex items-center gap-1.5">
                  <Badge variant="muted">{r.from || "—"}</Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="default">{r.to}</Badge>
                </span>
              </td>
              <td className={TD + " text-ink"}>{r.changedBy}</td>
              <td className={TD + " text-muted-foreground"}>{truncate(r.note, 40) || "—"}</td>
              <td className={TD + " text-muted-foreground"}>{formatDateTime(r.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PanelShell>
  );
}
