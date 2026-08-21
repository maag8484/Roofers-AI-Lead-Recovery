import { Inbox, AlertCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

// Shared chrome for the recent-activity panels: header (with optional "View all"
// link), loading skeleton rows, inline error, empty state, and the content well.
// Panels render stacked list rows rather than tables — at half-width a 5-column
// table wraps every cell and needs its own horizontal scrollbar.
export function PanelShell({
  title,
  icon: Icon,
  action,
  actionLabel = "View all",
  loading,
  error,
  empty,
  emptyIcon: EmptyIcon = Inbox,
  emptyText = "Nothing here yet.",
  maxHeight = "22rem",
  children,
}) {
  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardContent className="p-0">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-5">
          {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
          <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{title}</h3>
          {action && (
            <Link
              to={action}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50"
            >
              {actionLabel}
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {loading && (
          <div className="space-y-2.5 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 px-5 py-8 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Couldn't load this panel.
          </div>
        )}

        {!loading && !error && empty && (
          <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-secondary">
              <EmptyIcon className="h-5 w-5 text-muted-foreground/60" />
            </span>
            <p className="text-sm text-muted-foreground">{emptyText}</p>
          </div>
        )}

        {!loading && !error && !empty && (
          <div
            className="divide-y divide-border/60 overflow-y-auto"
            style={{ maxHeight: maxHeight }}
          >
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Small shared helpers for panel rows.
export function truncate(text, n = 60) {
  if (!text) return "";
  return text.length > n ? text.slice(0, n) + "…" : text;
}
