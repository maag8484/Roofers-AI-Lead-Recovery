import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/admin/useNotifications";
import { SeverityIcon } from "./SeverityBadge";
import { relativeTime, cn } from "@/lib/utils";

const trunc = (t, n = 100) => (!t ? "" : t.length > n ? t.slice(0, n) + "…" : t);

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { items, unread, loading, markRead } = useNotifications(open); // paused while open
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onRow = async (n) => {
    if (!n.read_at) await markRead(n.id);
    // Navigate only when a link is present; link-less rows just mark read.
    const link = n.metadata?.link;
    if (link) {
      setOpen(false);
      navigate(link);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
          <div className="border-b border-border px-4 py-2.5">
            <p className="text-sm font-bold text-ink">Notifications</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-secondary" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">You're all caught up.</p>
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => onRow(n)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left hover:bg-secondary/60",
                        !n.read_at && "bg-brand-50/40"
                      )}
                    >
                      <SeverityIcon severity={n.severity} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {!n.read_at && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                          <p className="truncate text-sm font-medium text-ink">{n.title}</p>
                        </div>
                        {n.body && <p className="text-xs text-muted-foreground">{trunc(n.body, 100)}</p>}
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{relativeTime(n.created_at)}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-border p-2">
            <Link
              to="/admin/notifications"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-center text-sm font-medium text-brand-600 hover:bg-secondary"
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
