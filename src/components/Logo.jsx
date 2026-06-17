import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, dark = false, iconOnly = false }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
        <Home className="h-5 w-5" strokeWidth={2.4} />
      </span>
      {!iconOnly && (
        <span
          className={cn(
            "text-lg font-extrabold tracking-tight",
            dark ? "text-white" : "text-ink"
          )}
        >
          Roof AI <span className="text-brand-600">Lead Recovery</span>
        </span>
      )}
    </div>
  );
}
