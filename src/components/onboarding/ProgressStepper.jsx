import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Stripe-style step indicator: "Step N of total" + an animated progress bar.
export function ProgressStepper({ current, total, labels }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>
          Step {current} of {total}
          {labels?.[current - 1] ? (
            <span className="text-ink"> · {labels[current - 1]}</span>
          ) : null}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full rounded-full bg-brand-600"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 220, damping: 30 }}
        />
      </div>
      <div className="flex gap-1.5 pt-0.5" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < current ? "bg-brand-600" : "bg-secondary"
            )}
          />
        ))}
      </div>
    </div>
  );
}
