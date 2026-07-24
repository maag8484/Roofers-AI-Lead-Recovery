import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ALL_STATUSES, statusLabel } from "@/config/customerStatus";
import { StatusBadge } from "./StatusBadge";
import { useChangeStatus } from "@/hooks/admin/useChangeStatus";
import { maybeSendStatusLiveEmail } from "@/lib/emailSites";

// Status-change modal used both inline (list kebab) and from the detail page.
// Submits via the atomic RPC (useChangeStatus). Same-status is disabled client
// side AND rejected server-side by the RPC as a second line of defense.
// customerId: single-target mode. bulkIds: apply to many (loops the RPC per id;
// the RPC's own same-status guard skips no-op rows). Exactly one of the two is set.
export function StatusChangeModal({
  open,
  customerId,
  bulkIds,
  currentStatus,
  companyName,
  customerEmail, // optional — enables the example STATUS_LIVE send site
  onClose,
  onSaved,
}) {
  const { change, saving } = useChangeStatus();
  // Postgres enums come back lowercase ("new"); ALL_STATUSES uses uppercase.
  // Normalize on the way in so the Select always finds a matching item.
  const normalizedCurrent = currentStatus?.toUpperCase() ?? "";
  const [toStatus, setToStatus] = useState(normalizedCurrent);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setToStatus(currentStatus?.toUpperCase() ?? "");
      setNote("");
    }
  }, [open, currentStatus]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const unchanged = toStatus === normalizedCurrent;

  const submit = async () => {
    if (bulkIds?.length) {
      // Apply per id; each is its own atomic RPC call. Rows already in the
      // target status are rejected by the RPC guard and counted as skipped.
      let ok = 0;
      let skipped = 0;
      for (const id of bulkIds) {
        const res = await change(id, toStatus, note);
        if (res.ok) ok += 1;
        else skipped += 1;
      }
      const skippedClause = skipped ? `, skipped ${skipped}` : "";
      toast.success(`Updated ${ok}${skippedClause}`);
      onSaved?.();
      onClose();
      return;
    }

    const res = await change(customerId, toStatus, note);
    if (res.ok) {
      // EXAMPLE feature-flagged send site (default OFF -> no-op). Copyable
      // pattern for routing real customer email through the health-monitored
      // gmail-send pipe. See src/lib/emailSites.js.
      if (toStatus === "LIVE") {
        maybeSendStatusLiveEmail({ to: customerEmail, companyName });
      }
      toast.success(`Status → ${statusLabel(toStatus)}`);
      onSaved?.();
      onClose();
    } else {
      toast.error(res.message || "Could not change status.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close" className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Change status"
        className="relative w-full max-w-md rounded-2xl border border-border bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-bold text-ink">Change status</h2>
            {companyName && <p className="text-sm text-muted-foreground">{companyName}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Current:</span>
            <StatusBadge status={normalizedCurrent} />
          </div>

          <div className="space-y-1.5">
            <Label>New status</Label>
            <Select value={toStatus} onValueChange={setToStatus} disabled={saving}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} disabled={s === normalizedCurrent}>
                    {statusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status-note">Note (optional)</Label>
            <textarea
              id="status-note"
              rows={3}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why is this changing?"
              className="flex w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1"
            />
            <p className="text-right text-xs text-muted-foreground">{note.length}/500</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-5">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || unchanged} className="min-w-28">
            {saving ? <Spinner className="text-white" /> : "Save change"}
          </Button>
        </div>
      </div>
    </div>
  );
}
