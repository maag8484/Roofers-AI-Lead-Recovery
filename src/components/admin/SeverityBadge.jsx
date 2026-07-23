import { Info, AlertTriangle, AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";

const MAP = {
  INFO: { icon: Info, cls: "text-brand-600", bg: "bg-brand-50" },
  WARNING: { icon: AlertTriangle, cls: "text-amber-600", bg: "bg-amber-50" },
  CRITICAL: { icon: AlertOctagon, cls: "text-red-600", bg: "bg-red-50" },
};

// Severity icon chip for notifications (INFO / WARNING / CRITICAL).
export function SeverityIcon({ severity, className }) {
  const m = MAP[severity] ?? MAP.INFO;
  const Icon = m.icon;
  return (
    <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", m.bg, className)}>
      <Icon className={cn("h-4 w-4", m.cls)} />
    </span>
  );
}
