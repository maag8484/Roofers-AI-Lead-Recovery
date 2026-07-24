import { useStatusHistory } from "@/hooks/admin/useStatusHistory";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Vertical stepper deriving each milestone's timestamp from real data:
//   Account Created   -> roofing_companies.created_at
//   Payment Completed -> earliest subscriptions.current_period_start
//   Business Submitted-> earliest history to_status = BUSINESS_INFO_SUBMITTED
//   Admin Review      -> earliest history to_status = PENDING_REVIEW
//   AI Configured     -> earliest history to_status = AI_ACTIVATED
//   Activated         -> earliest history to_status = LIVE
// A null timestamp renders pending (grey); a set one renders complete (brand).
export function CustomerTimeline({ customer, subscription, refreshKey }) {
  const { data: history, loading } = useStatusHistory(customer.id, refreshKey);

  // earliest created_at for a given to_status
  const earliestTo = (status) => {
    const rows = history.filter((h) => h.to === status);
    if (!rows.length) return null;
    return rows.reduce((min, r) => (r.created_at < min ? r.created_at : min), rows[0].created_at);
  };

  const steps = [
    { label: "Account Created", at: customer.created_at },
    { label: "Payment Completed", at: subscription?.current_period_start ?? null },
    { label: "Business Submitted", at: earliestTo("BUSINESS_INFO_SUBMITTED") },
    { label: "Admin Review", at: earliestTo("PENDING_REVIEW") },
    { label: "AI Configured", at: earliestTo("AI_ACTIVATED") },
    { label: "Activated", at: earliestTo("LIVE") },
  ];

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded-lg bg-secondary" />
        ))}
      </div>
    );
  }

  return (
    <ol className="space-y-0">
      {steps.map((s, i) => {
        const done = !!s.at;
        const last = i === steps.length - 1;
        return (
          <li key={s.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full",
                  done ? "bg-brand-600" : "border-2 border-border bg-white"
                )}
              />
              {!last && <span className={cn("w-0.5 flex-1", done ? "bg-brand-200" : "bg-border")} />}
            </div>
            <div className={cn("pb-5", last && "pb-0")}>
              <p className={cn("text-sm font-medium", done ? "text-ink" : "text-muted-foreground")}>
                {s.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {done ? formatDateTime(s.at) : "Pending"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
