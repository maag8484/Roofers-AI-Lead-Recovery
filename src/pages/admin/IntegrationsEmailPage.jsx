import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { invokeFunction } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function AdminIntegrationsEmailPage() {
  const [busy, setBusy] = useState(false);
  const [params] = useSearchParams();

  useEffect(() => {
    const g = params.get("gmail");
    if (g === "connected") toast.success("Gmail connected successfully!");
    else if (g === "error") toast.error(`Gmail connection failed (${params.get("reason") || "error"}).`);
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

  return (
    <div className="max-w-md">
      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-ink">Gmail Integration</h2>
              <p className="text-sm text-muted-foreground">Connect Gmail to send emails to admins and customers.</p>
            </div>
          </div>
          <Button className="w-full" onClick={connectGmail} disabled={busy}>
            {busy ? <Spinner className="text-white" /> : <><RefreshCw className="h-4 w-4" /> Connect / Reconnect Gmail</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
