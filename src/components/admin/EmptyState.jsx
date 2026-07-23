import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

// Reusable empty/placeholder state: icon + title + optional description + action.
// Used for "Coming soon" placeholders in Phase 1 and real empty tables later.
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action, // { label, onClick } | { label, to }
  className = "",
}) {
  return (
    <div
      className={
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white/50 px-6 py-16 text-center " +
        className
      }
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <div className="mt-5">
          {action.to ? (
            <Button asChild>
              <a href={action.to}>{action.label}</a>
            </Button>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  );
}
