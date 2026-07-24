import { onboardingPercent } from "@/config/customerStatus";
import { StatusBadge } from "./StatusBadge";

// Onboarding % bar for progression statuses; for terminal statuses
// (CANCELLED/REJECTED/PAUSED/SUPPORT_REQUIRED) renders the badge instead of a
// meaningless percentage. `compact` is the table-cell variant.
export function OnboardingProgress({ status, compact }) {
  const pct = onboardingPercent(status);

  if (pct == null) {
    return <StatusBadge status={status} />;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{pct}%</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-ink">Onboarding progress</span>
        <span className="font-semibold text-brand-600">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
