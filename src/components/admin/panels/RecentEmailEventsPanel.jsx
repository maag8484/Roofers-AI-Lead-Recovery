import { Mail } from "lucide-react";
import { useRecentEmailEvents } from "@/hooks/admin/useRecentEmailEvents";
import { PanelShell, truncate } from "./PanelShell";
import { formatDateTimeShort } from "@/lib/utils";

export function RecentEmailEventsPanel() {
  const { data, loading, error } = useRecentEmailEvents();

  return (
    <PanelShell
      title="Recent Email Events"
      icon={Mail}
      loading={loading}
      error={error}
      empty={data.length === 0}
      emptyIcon={Mail}
      emptyText="No email events yet."
    >
      {data.map((r) => (
        <div
          key={r.id}
          className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/50"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Mail className="h-4 w-4" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <p className="min-w-0 flex-1 break-all font-mono text-xs font-semibold text-ink">
                {r.event}
              </p>
              <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                {formatDateTimeShort(r.created_at)}
              </span>
            </div>
            {r.detail && (
              <p className="mt-1 text-sm text-muted-foreground" title={r.detail}>
                {truncate(r.detail, 120)}
              </p>
            )}
            {r.customer && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.customer}</p>
            )}
          </div>
        </div>
      ))}
    </PanelShell>
  );
}
