import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// Server-paginated notifications for the full page. filter: all|unread|CRITICAL|
// WARNING|INFO. Sort is created_at desc (fixed).
export function useNotificationsList({ page, pageSize, filter }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from("admin_notifications")
        .select("id, type, title, body, severity, read_at, metadata, created_at", { count: "exact" })
        .order("created_at", { ascending: false });

      if (filter === "unread") q = q.is("read_at", null);
      else if (["CRITICAL", "WARNING", "INFO"].includes(filter)) q = q.eq("severity", filter);

      const from = page * pageSize;
      q = q.range(from, from + pageSize - 1);

      const { data, count, error: qErr } = await q;
      if (qErr) throw qErr;
      setRows(data ?? []);
      setTotal(count ?? 0);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filter]);

  useEffect(() => {
    run();
  }, [run]);

  const setRead = useCallback(async (id, read) => {
    const read_at = read ? new Date().toISOString() : null;
    setRows((prev) => prev.map((n) => (n.id === id ? { ...n, read_at } : n)));
    await supabase.from("admin_notifications").update({ read_at }).eq("id", id);
  }, []);

  const markAllRead = useCallback(async () => {
    await supabase.from("admin_notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
    run();
  }, [run]);

  return { rows, total, loading, error, refetch: run, setRead, markAllRead };
}
