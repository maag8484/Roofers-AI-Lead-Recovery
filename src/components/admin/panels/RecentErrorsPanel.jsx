import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useRecentErrors } from "@/hooks/admin/useRecentErrors";
import { PanelShell, truncate } from "./PanelShell";
import { formatDateTimeShort } from "@/lib/utils";

export function RecentErrorsPanel() {
  const { data, loading, error } = useRecentErrors();

  return (
    <PanelShell
      title="Recent Errors"
      icon={AlertTriangle}
      loading={loading}
      error={error}
      empty={data.length === 0}
      emptyIcon={ShieldCheck}
      emptyText="No errors recorded — everything looks healthy."
    >
      {data.map((r) => (
        <div
          key={r.id}
          className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/50"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <AlertTriangle className="h-4 w-4" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              {/* Action codes are long SCREAMING_SNAKE strings — let them break. */}
              <p className="min-w-0 flex-1 break-all font-mono text-xs font-semibold text-ink">
                {r.action}
              </p>
              <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                {formatDateTimeShort(r.created_at)}
              </span>
            </div>
            <p className="mt-1 text-sm text-red-600" title={r.message}>
              {truncate(r.message, 120)}
            </p>
            {r.customer && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.customer}</p>
            )}
          </div>
        </div>
      ))}
    </PanelShell>
  );
}
