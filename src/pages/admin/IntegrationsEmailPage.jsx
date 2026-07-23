import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Mail, RefreshCw, Send, Activity, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase, invokeFunction } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useEmailHealth } from "@/hooks/admin/useEmailHealth";
import { SendSiteIndicator } from "@/components/admin/SendSiteIndicator";
import { formatDateTime, cn } from "@/lib/utils";

const PILL = {
  CONNECTED: "bg-emerald-50 text-emerald-700",
  DISCONNECTED: "bg-red-50 text-red-700",
  EXPIRED: "bg-red-50 text-red-700",
  NEEDS_REAUTH: "bg-red-50 text-red-700",
};

function trunc(t, n = 120) {
  if (!t) return "";
  return t.length > n ? t.slice(0, n) + "…" : t;
}

export default function AdminIntegrationsEmailPage() {
  const { user } = useAuth();
  const { data, loading, error } = useEmailHealth();
  const [row, setRow] = useState(null);
  const [busy, setBusy] = useState(null); // 'reconnect' | 'test' | 'check'
  const [params] = useSearchParams();

  // useEmailHealth loads once; keep a local copy we can refresh after actions.
  useEffect(() => {
    if (data) setRow(data);
  }, [data]);

  // Surface the OAuth callback result (?gmail=connected|error).
  useEffect(() => {
    const g = params.get("gmail");
    if (g === "connected") toast.success("Gmail connected!");
    else if (g === "error") toast.error(`Gmail connection failed (${params.get("reason") || "error"}).`);
    if (g) window.history.replaceState({}, "", "/admin/integrations/email");
  }, [params]);

  const refresh = async () => {
    const { data: fresh } = await supabase
      .from("email_integration_status")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    setRow(fresh ?? null);
  };

  const reconnect = async () => {
    setBusy("reconnect");
    try {
      const res = await invokeFunction("gmail-oauth-start", {
        redirect_to: `${window.location.origin}/admin/integrations/email`,
      });
      if (res?.url) window.location.href = res.url;
      else throw new Error(res?.error ?? "No OAuth URL returned.");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't start Gmail connect. Is gmail-oauth-start deployed?");
      setBusy(null);
    }
  };

  const sendTest = async () => {
    setBusy("test");
    try {
      const to = import.meta.env.VITE_ADMIN_TEST_EMAIL || user?.email;
      if (!to) throw new Error("No test destination (set VITE_ADMIN_TEST_EMAIL).");
      const res = await invokeFunction("gmail-send", {
        to,
        subject: "Roof AI — test email",
        body: "This confirms your Gmail integration can send.",
      });
      if (res?.ok) toast.success(`Test email sent to ${to}`);
      else throw new Error(res?.error ?? "Send failed.");
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Test send failed.");
    } finally {
      await refresh();
      setBusy(null);
    }
  };

  const checkNow = async () => {
    setBusy("check");
    try {
      const res = await invokeFunction("gmail-health-check", {});
      toast.success(`Health check: ${res?.status ?? "done"}`);
    } catch (e) {
      console.error(e);
      toast.error("Health check failed to run.");
    } finally {
      await refresh();
      setBusy(null);
    }
  };

  const s = row ?? data;
  const connected = s?.status === "CONNECTED";

  return (
    <div className="max-w-3xl space-y-6">
      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-bold text-ink">Gmail</h2>
                <p className="text-xs text-muted-foreground">Notification email sending</p>
              </div>
            </div>
            {loading && !s ? (
              <span className="h-6 w-24 animate-pulse rounded-full bg-secondary" />
            ) : (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                  PILL[s?.status] ?? "bg-secondary text-muted-foreground"
                )}
              >
                {connected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                {s?.status ?? "UNKNOWN"}
              </span>
            )}
          </div>

          {error ? (
            <p className="text-sm text-red-600">Couldn't load integration status.</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Metric label="Connected" value={s?.connected_at ? formatDateTime(s.connected_at) : "—"} />
                <Metric label="Last successful send" value={s?.last_successful_email_at ? formatDateTime(s.last_successful_email_at) : "—"} />
                <Metric label="Last failed send" value={s?.last_failed_email_at ? formatDateTime(s.last_failed_email_at) : "—"} />
                <Metric label="Emails sent today" value={s?.emails_sent_today ?? 0} />
                <Metric label="OAuth expires" value={s?.oauth_expires_at ? formatDateTime(s.oauth_expires_at) : "—"} />
                <Metric label="Last health check" value={s?.last_health_check_at ? formatDateTime(s.last_health_check_at) : "—"} />
              </div>

              {s?.last_error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700" title={s.last_error}>
                  <span className="font-semibold">Last error: </span>
                  {trunc(s.last_error, 120)}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                <Button onClick={reconnect} disabled={busy === "reconnect"}>
                  {busy === "reconnect" ? (
                    <Spinner className="text-white" />
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" /> {connected ? "Reconnect Gmail" : "Connect Gmail"}
                    </>
                  )}
                </Button>

                <Button variant="secondary" onClick={sendTest} disabled={!connected || busy === "test"}>
                  {busy === "test" ? <Spinner /> : (<><Send className="h-4 w-4" /> Send test email</>)}
                </Button>

                <Button variant="secondary" onClick={checkNow} disabled={busy === "check"}>
                  {busy === "check" ? <Spinner /> : (<><Activity className="h-4 w-4" /> Check now</>)}
                </Button>
              </div>

              {!connected && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Connect Gmail to enable test sends. Reconnect uses admin-only OAuth.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <SendSiteIndicator />
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
