import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

// Bell hook: unread count + the 10 most recent notifications. Polls every 30s
// while `paused` is false (dropdown closed); pauses while the dropdown is open
// to avoid flicker. The interval is ALWAYS cleared on unmount / dependency
// change — the classic polling leak this guards against.
export function useNotifications(paused) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const timer = useRef(null);

  const load = useCallback(async () => {
    const [{ data: recent }, { count }] = await Promise.all([
      supabase
        .from("admin_notifications")
        .select("id, type, title, body, severity, read_at, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("admin_notifications")
        .select("*", { count: "exact", head: true })
        .is("read_at", null),
    ]);
    setItems(recent ?? []);
    setUnread(count ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(); // always load once on mount / when unpausing
    if (paused) return; // don't start the interval while the dropdown is open
    timer.current = setInterval(load, 30_000);
    return () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
  }, [paused, load]);

  // Mark one read locally + server-side.
  const markRead = useCallback(async (id) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    setUnread((u) => Math.max(0, u - 1));
    await supabase.from("admin_notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  }, []);

  return { items, unread, loading, reload: load, markRead };
}
