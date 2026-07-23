import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// All status transitions for one customer, newest first, with the changing
// admin's name resolved via profiles (admins holds only user_id).
export function useStatusHistory(customerId, refreshKey) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const { data: hist, error: hErr } = await supabase
        .from("customer_status_history")
        .select("id, from_status, to_status, note, changed_by_admin_id, created_at")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      if (hErr) throw hErr;

      const rows = hist ?? [];
      const adminIds = [...new Set(rows.map((r) => r.changed_by_admin_id).filter(Boolean))];
      const nameBy = {};
      if (adminIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", adminIds);
        (profs ?? []).forEach((p) => (nameBy[p.id] = p.full_name));
      }

      setData(
        rows.map((r) => ({
          id: r.id,
          from: r.from_status,
          to: r.to_status,
          note: r.note,
          changedBy: nameBy[r.changed_by_admin_id] || "System",
          created_at: r.created_at,
        }))
      );
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return { data, loading, error };
}
