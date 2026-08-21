import { GitBranch, ArrowRight } from "lucide-react";
import { useRecentStatusChanges } from "@/hooks/admin/useRecentStatusChanges";
import { PanelShell, truncate } from "./PanelShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDateTimeShort } from "@/lib/utils";

export function RecentStatusChangesPanel() {
  const { data, loading, error } = useRecentStatusChanges();

  return (
    <PanelShell
      title="Recent Status Changes"
      icon={GitBranch}
      action="/admin/audit"
      loading={loading}
      error={error}
      empty={data.length === 0}
      emptyIcon={GitBranch}
      emptyText="No status changes yet."
    >
      {data.map((r) => (
        <div key={r.id} className="px-4 py-3 transition-colors hover:bg-secondary/50">
          <div className="flex items-baseline gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
              {r.company}
            </p>
            <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
              {formatDateTimeShort(r.created_at)}
            </span>
          </div>

          {/* Transition wraps as a unit instead of forcing a wide table column. */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {r.from ? (
              <StatusBadge status={r.from} />
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
            <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
            <StatusBadge status={r.to} />
          </div>

          <p className="mt-1.5 truncate text-xs text-muted-foreground">
            by {r.changedBy}
            {r.note ? ` · ${truncate(r.note, 60)}` : ""}
          </p>
        </div>
      ))}
    </PanelShell>
  );
}
