import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Mail, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase, invokeFunction } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function AdminIntegrationsEmailPage() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [params] = useSearchParams();

  const fetchStatus = async () => {
    setLoadingStatus(true);
    const { data } = await supabase
      .from("email_integration_status")
      .select("status, connected_at, last_successful_email_at, emails_sent_today")
      .maybeSingle();
    setStatus(data ?? null);
    setLoadingStatus(false);
  };

  useEffect(() => {
    fetchStatus();
    const g = params.get("gmail");
    if (g === "connected") {
      toast.success("Gmail connected successfully!");
      fetchStatus();
    } else if (g === "error") {
      toast.error(`Gmail connection failed (${params.get("reason") || "error"}).`);
    }
    if (g) window.history.replaceState({}, "", "/admin/integrations/email");
  }, [params]);

  const connectGmail = async () => {
    setBusy(true);
    try {
      const res = await invokeFunction("gmail-oauth-start", {
        redirect_to: `${window.location.origin}/admin/integrations/email`,
      });
      if (res?.url) window.location.href = res.url;
      else throw new Error(res?.error ?? "No OAuth URL returned.");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't connect Gmail. Please try again.");
      setBusy(false);
    }
  };

  const fmt = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";

  const isConnected = status?.status === "CONNECTED";

  return (
    <div className="max-w-md">
      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-ink">Gmail Integration</h2>
              <p className="text-sm text-muted-foreground">Connect Gmail to send emails to admins and customers.</p>
            </div>
          </div>

          {/* Status badge */}
          {loadingStatus ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" /> Checking connection...
            </div>
          ) : isConnected ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-emerald-700">Gmail Connected</span>
              </div>
              <div className="text-sm text-emerald-700 space-y-1">
                {status?.connected_at && (
                  <p>Connected on <strong>{fmt(status.connected_at)}</strong></p>
                )}
                {status?.last_successful_email_at && (
                  <p>Last email sent: <strong>{fmt(status.last_successful_email_at)}</strong></p>
                )}
                <p>Emails sent today: <strong>{status?.emails_sent_today ?? 0}</strong></p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-red-700">Gmail not connected — emails won't send.</span>
            </div>
          )}

          <Button className="w-full" onClick={connectGmail} disabled={busy}>
            {busy ? <Spinner className="text-white" /> : <><RefreshCw className="h-4 w-4" /> {isConnected ? "Reconnect Gmail" : "Connect Gmail"}</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
