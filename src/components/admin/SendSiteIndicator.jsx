import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EMAIL_SITES, isSiteEnabled } from "@/lib/emailSites";

// Lists every registered email send site and whether it currently routes
// through gmail-send (flag on) or is inert (flag off). Reflects the VITE_ flags
// at build time.
export function SendSiteIndicator() {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6">
        <h3 className="font-bold text-ink">Email send sites</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Where customer email flows through the health-monitored pipe. All default off;
          flip a flag in production once verified in dev.
        </p>
        <ul className="space-y-2.5">
          {EMAIL_SITES.map((s) => {
            const on = isSiteEnabled(s.flagEnv);
            return (
              <li key={s.key} className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  {on ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 text-muted-foreground/40" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-ink">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                    <code className="text-[11px] text-muted-foreground">{s.flagEnv}</code>
                  </div>
                </div>
                <span
                  className={
                    "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold " +
                    (on ? "bg-emerald-50 text-emerald-700" : "bg-secondary text-muted-foreground")
                  }
                >
                  {on ? "gmail-send" : "off (old path)"}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
