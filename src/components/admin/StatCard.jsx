import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Compute a delta chip from current vs. prior. Returns null when no prior-period
// data exists (prior === 0) — per spec we OMIT the chip rather than show "—"/0%.
export function computeDelta(current, prior) {
  if (prior == null || prior === 0) return null; // no computable prior period
  const pct = Math.round(((current - prior) / prior) * 100);
  if (pct === 0) return { pct: 0, dir: "flat" };
  return { pct, dir: pct > 0 ? "up" : "down" };
}

const TONE = {
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  brand: "bg-brand-50 text-brand-600",
};

// KPI card: icon chip, label, value, optional delta chip, optional status color.
// `loading` renders a skeleton in place of the value.
export function StatCard({ icon: Icon, label, value, delta, tone = "brand", loading }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              TONE[tone] ?? TONE.brand
            )}
          >
            {Icon && <Icon className="h-5 w-5" />}
          </span>
          {delta && !loading && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                delta.dir === "up" && "bg-emerald-50 text-emerald-600",
                delta.dir === "down" && "bg-red-50 text-red-600",
                delta.dir === "flat" && "bg-secondary text-muted-foreground"
              )}
            >
              {delta.dir === "up" && <ArrowUpRight className="h-3 w-3" />}
              {delta.dir === "down" && <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta.pct)}%
            </span>
          )}
        </div>
        {loading ? (
          <div className="mt-3 h-8 w-16 animate-pulse rounded bg-secondary" />
        ) : (
          <p className="mt-3 text-3xl font-extrabold text-ink">{value}</p>
        )}
        <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
