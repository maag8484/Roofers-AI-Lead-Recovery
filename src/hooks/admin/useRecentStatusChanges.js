import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// 10 most recent status transitions from customer_status_history, resolved to
// company name (via customer_id → roofing_companies) and changed-by name (via
// changed_by_admin_id → profiles). admins holds only user_id, so the human name
// comes from profiles keyed by that id.
export function useRecentStatusChanges() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: hist, error: hErr } = await supabase
          .from("customer_status_history")
          .select("id, customer_id, from_status, to_status, note, changed_by_admin_id, created_at")
          .order("created_at", { ascending: false })
          .limit(10);
        if (hErr) throw hErr;

        const rows = hist ?? [];
        const companyIds = [...new Set(rows.map((r) => r.customer_id).filter(Boolean))];
        const adminIds = [...new Set(rows.map((r) => r.changed_by_admin_id).filter(Boolean))];

        const companyBy = {};
        if (companyIds.length) {
          const { data: cos } = await supabase
            .from("roofing_companies")
            .select("id, company_name")
            .in("id", companyIds);
          (cos ?? []).forEach((c) => (companyBy[c.id] = c.company_name));
        }

        const adminBy = {};
        if (adminIds.length) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", adminIds);
          (profs ?? []).forEach((p) => (adminBy[p.id] = p.full_name));
        }

        if (!active) return;
        setData(
          rows.map((r) => ({
            id: r.id,
            company: companyBy[r.customer_id] || "—",
            from: r.from_status,
            to: r.to_status,
            changedBy: adminBy[r.changed_by_admin_id] || "System",
            note: r.note,
            created_at: r.created_at,
          }))
        );
      } catch (e) {
        if (active) setError(e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}
