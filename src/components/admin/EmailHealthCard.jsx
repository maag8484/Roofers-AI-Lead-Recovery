import { Mail, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEmailHealth } from "@/hooks/admin/useEmailHealth";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const PILL = {
  CONNECTED: "bg-emerald-50 text-emerald-700",
  DISCONNECTED: "bg-red-50 text-red-700",
  EXPIRED: "bg-red-50 text-red-700",
  NEEDS_REAUTH: "bg-red-50 text-red-700",
};

function trunc(text, n = 120) {
  if (!text) return "";
  return text.length > n ? text.slice(0, n) + "…" : text;
}

// Prominent Gmail health card. Reads the email_integration_status singleton.
// Reconnect button renders only when status !== CONNECTED; its click is a
// deliberate no-op until Phase 5 wires the OAuth flow.
export function EmailHealthCard() {
  const { data, loading, error } = useEmailHealth();

  const reconnect = () => {
    console.warn("Reconnect flow lands in Phase 5");
  };

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-bold text-ink">Email Integration</h3>
              <p className="text-xs text-muted-foreground">Gmail send · notification delivery</p>
            </div>
          </div>

          {loading ? (
            <span className="h-6 w-24 animate-pulse rounded-full bg-secondary" />
          ) : (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                PILL[data?.status] ?? "bg-secondary text-muted-foreground"
              )}
            >
              {data?.status === "CONNECTED" ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              {data?.status ?? "UNKNOWN"}
            </span>
          )}
        </div>

        {error ? (
          <p className="text-sm text-red-600">Couldn't load email integration status.</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Connected" value={data?.connected_at ? formatDateTime(data.connected_at) : "—"} loading={loading} />
              <Metric label="Last sent" value={data?.last_successful_email_at ? formatDateTime(data.last_successful_email_at) : "—"} loading={loading} />
              <Metric label="Last failed" value={data?.last_failed_email_at ? formatDateTime(data.last_failed_email_at) : "—"} loading={loading} />
              <Metric label="Sent today" value={data?.emails_sent_today ?? 0} loading={loading} />
            </div>

            {data?.last_error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700" title={data.last_error}>
                <span className="font-semibold">Last error: </span>
                {trunc(data.last_error, 120)}
              </div>
            )}

            {!loading && data?.status !== "CONNECTED" && (
              <div className="mt-5">
                <Button onClick={reconnect}>
                  <RefreshCw className="h-4 w-4" /> Reconnect Gmail
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, loading }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      {loading ? (
        <div className="mt-1 h-5 w-20 animate-pulse rounded bg-secondary" />
      ) : (
        <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
      )}
    </div>
  );
}
