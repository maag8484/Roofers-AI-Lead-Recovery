import { UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRecentSignups } from "@/hooks/admin/useRecentSignups";
import { PanelShell } from "./PanelShell";
import { formatDateTime } from "@/lib/utils";

const TH = "px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground";
const TD = "px-5 py-2.5 text-sm";

export function RecentSignupsPanel() {
  const { data, loading, error } = useRecentSignups();
  const navigate = useNavigate();
  return (
    <PanelShell
      title="Recent Customer Signups"
      loading={loading}
      error={error}
      empty={data.length === 0}
      emptyIcon={UserPlus}
      emptyText="No signups yet."
    >
      <table className="w-full">
        <thead className="border-b border-border">
          <tr>
            <th className={TH}>Company</th>
            <th className={TH}>Owner</th>
            <th className={TH}>Email</th>
            <th className={TH}>Created</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr
              key={r.id}
              onClick={() => navigate(`/admin/customers/${r.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/admin/customers/${r.id}`);
                }
              }}
              tabIndex={0}
              aria-label={`Open ${r.company}`}
              className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-secondary/40 focus:bg-secondary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600"
            >
              <td className={TD + " font-medium text-ink"}>{r.company}</td>
              <td className={TD + " text-ink"}>{r.owner}</td>
              <td className={TD + " text-muted-foreground"}>{r.email}</td>
              <td className={TD + " text-muted-foreground"}>{formatDateTime(r.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PanelShell>
  );
}
