import { AlertTriangle } from "lucide-react";
import { useRecentErrors } from "@/hooks/admin/useRecentErrors";
import { PanelShell, truncate } from "./PanelShell";
import { formatDateTime } from "@/lib/utils";

const TH = "px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground";
const TD = "px-5 py-2.5 text-sm";

export function RecentErrorsPanel() {
  const { data, loading, error } = useRecentErrors();
  return (
    <PanelShell
      title="Recent Errors"
      loading={loading}
      error={error}
      empty={data.length === 0}
      emptyIcon={AlertTriangle}
      emptyText="No errors recorded."
    >
      <table className="w-full">
        <thead className="border-b border-border">
          <tr>
            <th className={TH}>When</th>
            <th className={TH}>Action</th>
            <th className={TH}>Customer</th>
            <th className={TH}>Message</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
              <td className={TD + " text-muted-foreground"}>{formatDateTime(r.created_at)}</td>
              <td className={TD + " font-medium text-ink"}>{r.action}</td>
              <td className={TD + " text-muted-foreground"}>{r.customer || "—"}</td>
              <td className={TD + " text-red-600"} title={r.message}>
                {truncate(r.message, 60)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </PanelShell>
  );
}
