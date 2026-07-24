import { Mail } from "lucide-react";
import { useRecentEmailEvents } from "@/hooks/admin/useRecentEmailEvents";
import { PanelShell, truncate } from "./PanelShell";
import { formatDateTime } from "@/lib/utils";

const TH = "px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground";
const TD = "px-5 py-2.5 text-sm";

export function RecentEmailEventsPanel() {
  const { data, loading, error } = useRecentEmailEvents();
  return (
    <PanelShell
      title="Recent Email Events"
      loading={loading}
      error={error}
      empty={data.length === 0}
      emptyIcon={Mail}
      emptyText="No email events yet."
    >
      <table className="w-full">
        <thead className="border-b border-border">
          <tr>
            <th className={TH}>When</th>
            <th className={TH}>Event</th>
            <th className={TH}>Customer</th>
            <th className={TH}>Detail</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
              <td className={TD + " text-muted-foreground"}>{formatDateTime(r.created_at)}</td>
              <td className={TD + " font-medium text-ink"}>{r.event}</td>
              <td className={TD + " text-muted-foreground"}>{r.customer || "—"}</td>
              <td className={TD + " text-muted-foreground"} title={r.detail}>
                {truncate(r.detail, 60) || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </PanelShell>
  );
}
