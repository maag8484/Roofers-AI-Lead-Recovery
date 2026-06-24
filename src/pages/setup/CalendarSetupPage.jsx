import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, Check, ArrowRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase, invokeFunction } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { SetupLayout } from "@/components/setup/SetupLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function CalendarSetupPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [params] = useSearchParams();

  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // After OAuth, Google redirects back with ?calendar=connected (handled by edge fn).
  useEffect(() => {
    if (params.get("calendar") === "connected") {
      toast.success("Google Calendar connected!");
    } else if (params.get("calendar") === "error") {
      toast.error("Could not connect Google Calendar. Please try again.");
    }
  }, [params]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("calendar_connections")
      .select("google_email, calendar_id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setConnection(data ?? null);
        setLoading(false);
      });
  }, [user]);

  const connectGoogle = async () => {
    setConnecting(true);
    try {
      const res = await invokeFunction("google-oauth-start", {
        redirect_to: `${window.location.origin}/setup/calendar`,
      });
      if (res?.url) {
        window.location.href = res.url;
      } else {
        throw new Error("No OAuth URL returned.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Google connect failed. Is the google-oauth-start function deployed?");
      setConnecting(false);
    }
  };

  const disconnectCalendar = async () => {
    if (!user) return;
    setDisconnecting(true);
    const { error } = await supabase
      .from("calendar_connections")
      .delete()
      .eq("user_id", user.id);
    if (error) {
      toast.error(error.message);
    } else {
      setConnection(null);
      toast.success("Calendar disconnected.");
    }
    setDisconnecting(false);
  };

  const saveAndFinish = async () => {
    if (!user) return;
    setSaving(true);

    const { error: liveErr } = await supabase
      .from("roofing_companies")
      .update({ setup_step: 5, is_live: true })
      .eq("user_id", user.id);

    setSaving(false);
    if (liveErr) {
      toast.error(liveErr.message);
      return;
    }
    await refreshProfile();
    toast.success("You're all set — Roof AI is live!");
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <SetupLayout current="calendar">
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      </SetupLayout>
    );
  }

  return (
    <SetupLayout current="calendar">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
          <Calendar className="h-6 w-6 text-brand-600" />
        </span>
        <h1 className="text-2xl font-extrabold text-ink">Connect Your Google Calendar</h1>
        <p className="mt-1.5 text-muted-foreground">
          We'll check availability, book appointments, and send you confirmations.
        </p>
      </div>

      {!connection ? (
        <Card>
          <CardContent className="space-y-5 p-6">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Check your availability automatically</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Book inspections directly on your calendar</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Send you instant confirmations</li>
            </ul>
            <Button className="w-full" onClick={connectGoogle} disabled={connecting}>
              {connecting ? <Spinner className="text-white" /> : "Connect Google Calendar"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              You'll be redirected to Google to grant calendar access.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardContent className="flex items-center justify-between gap-3 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-5 w-5 text-emerald-600" />
                </span>
                <div>
                  <p className="font-semibold text-ink">Connected</p>
                  <p className="text-sm text-muted-foreground">
                    {connection.google_email || "Google account"} ·{" "}
                    {connection.calendar_id || "primary"} calendar
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={disconnectCalendar}
                disabled={disconnecting}
              >
                {disconnecting ? <Spinner className="h-4 w-4" /> : <><RefreshCw className="h-4 w-4" /> Change</>}
              </Button>
            </CardContent>
          </Card>

          <Button className="w-full" onClick={saveAndFinish} disabled={saving}>
            {saving ? <Spinner className="text-white" /> : (<>Save &amp; Go Live <ArrowRight /></>)}
          </Button>
        </div>
      )}
    </SetupLayout>
  );
}

