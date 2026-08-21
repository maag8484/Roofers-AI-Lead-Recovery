import { AlertCircle, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Shared chrome for dashboard charts: header with optional subtitle/right slot,
// skeleton, inline error, and empty state. Mirrors PanelShell so the two card
// families sit together without visual drift.
export function ChartCard({
  title,
  subtitle,
  icon: Icon = BarChart3,
  right,
  loading,
  error,
  empty,
  emptyText = "No data yet.",
  children,
}) {
  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardContent className="p-0">
        <div className="flex min-h-14 items-center gap-2 border-b border-border px-5 py-3">
          {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold text-ink">{title}</h3>
            {subtitle && (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>

        <div className="p-5">
          {loading && <div className="h-52 animate-pulse rounded-xl bg-secondary" />}

          {!loading && error && (
            <div className="flex items-center gap-2 py-8 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Couldn't load this chart.
            </div>
          )}

          {!loading && !error && empty && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-secondary">
                <BarChart3 className="h-5 w-5 text-muted-foreground/60" />
              </span>
              <p className="text-sm text-muted-foreground">{emptyText}</p>
            </div>
          )}

          {!loading && !error && !empty && children}
        </div>
      </CardContent>
    </Card>
  );
}
