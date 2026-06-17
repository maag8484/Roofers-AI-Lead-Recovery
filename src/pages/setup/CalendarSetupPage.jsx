import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, Check, ArrowRight, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase, invokeFunction } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { SetupLayout } from "@/components/setup/SetupLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIMES = [];
for (let h = 5; h <= 21; h++) {
  const hh = String(h).padStart(2, "0");
  TIMES.push({ value: `${hh}:00`, label: to12h(`${hh}:00`) });
  TIMES.push({ value: `${hh}:30`, label: to12h(`${hh}:30`) });
}
function to12h(t) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, "0")} ${period}`;
}

const DURATIONS = [
  { value: 30, label: "30 minutes" },
  { value: 60, label: "60 minutes" },
  { value: 90, label: "90 minutes" },
];

export default function CalendarSetupPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [params] = useSearchParams();

  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("17:00");
  const [duration, setDuration] = useState(60);
  const [lunch, setLunch] = useState(true);

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

  const saveAndFinish = async () => {
    if (!user) return;
    setSaving(true);
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    const row = {
      user_id: user.id,
      inspection_duration_minutes: duration,
      lunch_start: lunch ? "12:00" : null,
      lunch_end: lunch ? "13:00" : null,
    };
    days.forEach((d) => {
      row[`${d}_start`] = start;
      row[`${d}_end`] = end;
    });

    const { error: availErr } = await supabase
      .from("availability_settings")
      .upsert(row, { onConflict: "user_id" });

    const { error: liveErr } = await supabase
      .from("roofing_companies")
      .update({ setup_step: 5, is_live: true })
      .eq("user_id", user.id);

    setSaving(false);
    if (availErr || liveErr) {
      toast.error((availErr || liveErr).message);
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
            <CardContent className="flex items-center gap-3 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-5 w-5 text-emerald-600" />
              </span>
              <div>
                <p className="font-semibold text-ink">Connected</p>
                <p className="text-sm text-muted-foreground">
                  {connection.google_email || "Google account"} ·{" "}
                  {connection.calendar_id || "primary"} calendar
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-brand-600" />
                <h2 className="font-bold text-ink">Set your availability</h2>
              </div>

              <div>
                <Label className="mb-1.5 block">Working hours (Mon–Fri)</Label>
                <div className="flex items-center gap-2">
                  <TimeSelect value={start} onChange={setStart} />
                  <span className="text-muted-foreground">to</span>
                  <TimeSelect value={end} onChange={setEnd} />
                </div>
              </div>

              <div>
                <Label className="mb-1.5 block">Appointment duration</Label>
                <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((d) => (
                      <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={lunch}
                  onChange={(e) => setLunch(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-brand-600"
                />
                Block lunch break (12:00 PM – 1:00 PM)
              </label>

              <Button className="w-full" onClick={saveAndFinish} disabled={saving}>
                {saving ? <Spinner className="text-white" /> : (<>Save &amp; Go Live <ArrowRight /></>)}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </SetupLayout>
  );
}

function TimeSelect({ value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
      <SelectContent>
        {TIMES.map((t) => (
          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
