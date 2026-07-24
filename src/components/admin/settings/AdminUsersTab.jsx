import { useState } from "react";
import { UserPlus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useAdminList } from "@/hooks/admin/useAdminSettings";
import { formatDateTime } from "@/lib/utils";

// Admin roster + add/remove via the SECURITY DEFINER RPCs. Add = elevate an
// EXISTING auth.users account by email. Self-removal and last-admin removal are
// blocked in the RPC; the UI surfaces those messages.
export function AdminUsersTab() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const { admins, loading, addAdmin, removeAdmin } = useAdminList(refreshKey);
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => setRefreshKey((k) => k + 1);

  const submitAdd = async () => {
    setBusy(true);
    const res = await addAdmin(email.trim());
    setBusy(false);
    if (res.ok) {
      toast.success("Admin added.");
      setShowAdd(false);
      setEmail("");
      refresh();
    } else {
      toast.error(res.message || "Could not add admin.");
    }
  };

  const onRemove = async (userId, label) => {
    if (!window.confirm(`Remove admin access for ${label}?`)) return;
    const res = await removeAdmin(userId);
    if (res.ok) {
      toast.success("Admin removed.");
      refresh();
    } else {
      toast.error(res.message || "Could not remove admin.");
    }
  };

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-bold text-ink">Admin Users</h2>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <UserPlus className="h-4 w-4" /> Add admin
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                  <th className="px-4 py-3 font-medium">Last login</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.user_id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                    <td className="px-4 py-3 text-ink">
                      {a.email || "—"}
                      {a.user_id === user?.id && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{a.full_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(a.created_at)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.last_sign_in_at ? formatDateTime(a.last_sign_in_at) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.user_id !== user?.id && (
                        <button
                          onClick={() => onRemove(a.user_id, a.email || a.full_name || "this admin")}
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button aria-label="Close" className="absolute inset-0 bg-ink/50" onClick={() => setShowAdd(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-border p-5">
              <h3 className="font-bold text-ink">Add admin</h3>
              <button onClick={() => setShowAdd(false)} aria-label="Close" className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 p-5">
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">Email of existing user</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teammate@company.com"
                />
                <p className="text-xs text-muted-foreground">
                  The person must already have an account. This elevates an existing user to admin.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border p-5">
              <Button variant="secondary" onClick={() => setShowAdd(false)} disabled={busy}>Cancel</Button>
              <Button onClick={submitAdd} disabled={busy || !email.trim()}>
                {busy ? <Spinner className="text-white" /> : "Add admin"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
