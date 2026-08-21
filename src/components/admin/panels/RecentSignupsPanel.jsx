import { UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRecentSignups } from "@/hooks/admin/useRecentSignups";
import { PanelShell } from "./PanelShell";
import { formatDateTimeShort, initials } from "@/lib/utils";

export function RecentSignupsPanel() {
  const { data, loading, error } = useRecentSignups();
  const navigate = useNavigate();

  return (
    <PanelShell
      title="Recent Customer Signups"
      icon={UserPlus}
      action="/admin/customers"
      loading={loading}
      error={error}
      empty={data.length === 0}
      emptyIcon={UserPlus}
      emptyText="No signups yet."
    >
      {data.map((r) => {
        const company = r.company || "Unnamed company";
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => navigate(`/admin/customers/${r.id}`)}
            aria-label={`Open ${company}`}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50 focus:outline-none focus-visible:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
              {initials(r.company)}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{company}</p>
              <p className="truncate text-xs text-muted-foreground">
                {r.owner && r.owner !== "—" ? `${r.owner} · ` : ""}
                {r.email}
              </p>
            </div>

            <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
              {formatDateTimeShort(r.created_at)}
            </span>
          </button>
        );
      })}
    </PanelShell>
  );
}
