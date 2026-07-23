import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useAdminSettings } from "@/hooks/admin/useAdminSettings";

// Editable Gmail integration settings backed by the admin_settings singleton.
// daily_send_cap is read by gmail-send at send time, so this field is functional
// end-to-end.
export function GmailSettingsTab() {
  const { user } = useAuth();
  const { data, loading, save } = useAdminSettings();
  const [cap, setCap] = useState("");
  const [recipient, setRecipient] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setCap(String(data.daily_send_cap ?? ""));
      setRecipient(data.notification_recipient ?? "");
    }
  }, [data]);

  if (loading) return <Card className="rounded-2xl"><CardContent className="p-6"><Spinner /></CardContent></Card>;

  const onSave = async () => {
    const capNum = Number(cap);
    if (!Number.isFinite(capNum) || capNum < 0) {
      toast.error("Daily cap must be a non-negative number.");
      return;
    }
    setSaving(true);
    const { error } = await save({
      daily_send_cap: capNum,
      notification_recipient: recipient.trim() || null,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Settings saved.");
  };

  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-5 p-6">
        <div className="space-y-1.5">
          <Label htmlFor="cap">Daily send cap</Label>
          <Input id="cap" type="number" min="0" value={cap} onChange={(e) => setCap(e.target.value)} className="max-w-[200px]" />
          <p className="text-xs text-muted-foreground">
            Enforced by gmail-send. 0 blocks all sends (fail-closed).
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Health check interval</Label>
          <p className="text-sm text-ink">{data?.health_check_hint || "Every 5 minutes (external cron)"}</p>
          <p className="text-xs text-muted-foreground">Display-only — the schedule is configured in external cron.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="recipient">Notification email recipient</Label>
          <Input
            id="recipient"
            type="email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={user?.email || "admin@company.com"}
            className="max-w-md"
          />
          <p className="text-xs text-muted-foreground">Defaults to your admin email if left blank.</p>
        </div>

        <Button onClick={onSave} disabled={saving} className="min-w-28">
          {saving ? <Spinner className="text-white" /> : "Save settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
