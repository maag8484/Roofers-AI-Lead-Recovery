import { STATUS_COLOR, statusLabel } from "@/config/customerStatus";
import { cn } from "@/lib/utils";

// Colored pill for any of the 13 customer statuses. `size="lg"` for the detail
// header, default for table cells.
export function StatusBadge({ status, size = "sm", className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        size === "lg" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs",
        STATUS_COLOR[status] ?? "bg-secondary text-muted-foreground",
        className
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
