import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useNotificationPreferences } from "@/hooks/admin/useAdminSettings";

const TOGGLES = [
  { key: "on_gmail_disconnect", label: "Email me on Gmail disconnection", hint: "When the integration drops or needs re-auth." },
  { key: "on_critical_error", label: "Email me on critical system errors", hint: "CRITICAL-severity notifications." },
  { key: "on_new_signup", label: "Email me on new customer signup", hint: "Each time a customer creates an account." },
];

// Per-admin notification preferences (own row, upserted on toggle).
export function NotificationPreferencesTab() {
  const { prefs, loading, savePref } = useNotificationPreferences();

  if (loading || !prefs) {
    return <Card className="rounded-2xl"><CardContent className="p-6"><Spinner /></CardContent></Card>;
  }

  return (
    <Card className="rounded-2xl">
      <CardContent className="divide-y divide-border p-0">
        {TOGGLES.map((t) => (
          <label key={t.key} className="flex cursor-pointer items-center justify-between gap-4 p-5">
            <span>
              <span className="block text-sm font-medium text-ink">{t.label}</span>
              <span className="block text-xs text-muted-foreground">{t.hint}</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={!!prefs[t.key]}
              onClick={() => savePref({ [t.key]: !prefs[t.key] })}
              className={
                "relative h-6 w-11 shrink-0 rounded-full transition-colors " +
                (prefs[t.key] ? "bg-brand-600" : "bg-secondary")
              }
            >
              <span
                className={
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform " +
                  (prefs[t.key] ? "translate-x-5" : "translate-x-0.5")
                }
              />
            </button>
          </label>
        ))}
      </CardContent>
    </Card>
  );
}
