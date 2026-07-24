import { Inbox, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Shared chrome for the recent-activity panels: header, loading skeleton rows,
// inline error, empty state, and the scrollable table container. `columns` is
// used only to size the skeleton; the caller renders the real <table>.
export function PanelShell({
  title,
  loading,
  error,
  empty,
  emptyIcon: EmptyIcon = Inbox,
  emptyText = "Nothing here yet.",
  children,
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-0">
        <div className="border-b border-border px-5 py-3.5">
          <h3 className="text-sm font-bold text-ink">{title}</h3>
        </div>

        {loading && (
          <div className="space-y-2 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 px-5 py-6 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Couldn't load this panel.
          </div>
        )}

        {!loading && !error && empty && (
          <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
            <EmptyIcon className="mb-2 h-7 w-7 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{emptyText}</p>
          </div>
        )}

        {!loading && !error && !empty && (
          <div className="overflow-x-auto">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

// Small shared helpers for table cells.
export function truncate(text, n = 60) {
  if (!text) return "";
  return text.length > n ? text.slice(0, n) + "…" : text;
}
