import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Horizontal progress stepper.
 * steps: [{ label }]; current is 1-based; completed steps render a check.
 */
export function Stepper({ steps, current }) {
  return (
    <ol className="flex items-center">
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        const locked = n > current;
        return (
          <li key={s.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                  done && "border-emerald-500 bg-emerald-500 text-white",
                  active && "border-brand-600 bg-brand-600 text-white",
                  locked && "border-border bg-secondary text-muted-foreground"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : locked ? <Lock className="h-3.5 w-3.5" /> : n}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:block",
                  active ? "text-ink" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "mx-2 h-0.5 flex-1 rounded sm:mx-3",
                  done ? "bg-emerald-500" : "bg-border"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
