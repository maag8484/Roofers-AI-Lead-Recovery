import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// 10 most recent error activity_logs (result='ERROR' OR status='ERROR'),
// resolved to company name where customer_id is set.
export function useRecentErrors() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: logs, error: lErr } = await supabase
          .from("activity_logs")
          .select("id, customer_id, action, result, status, metadata, created_at")
          .or("result.eq.ERROR,status.eq.ERROR")
          .order("created_at", { ascending: false })
          .limit(10);
        if (lErr) throw lErr;

        const rows = logs ?? [];
        const companyIds = [...new Set(rows.map((r) => r.customer_id).filter(Boolean))];
        const companyBy = {};
        if (companyIds.length) {
          const { data: cos } = await supabase
            .from("roofing_companies")
            .select("id, company_name")
            .in("id", companyIds);
          (cos ?? []).forEach((c) => (companyBy[c.id] = c.company_name));
        }

        if (!active) return;
        setData(
          rows.map((r) => ({
            id: r.id,
            action: r.action,
            customer: r.customer_id ? companyBy[r.customer_id] || "—" : null,
            message: r.metadata?.message || r.result || "Error",
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
