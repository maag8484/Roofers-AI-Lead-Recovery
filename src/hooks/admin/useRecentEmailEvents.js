import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Canonical email/gmail event actions (established this phase; reused by the
// Phase 5 edge functions). 10 most recent, resolved to company name.
const EMAIL_ACTIONS = [
  "EMAIL_SENT",
  "EMAIL_SEND_FAILED",
  "GMAIL_CONNECTED",
  "GMAIL_DISCONNECTED",
  "GMAIL_RECONNECTED",
];

export function useRecentEmailEvents() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: logs, error: lErr } = await supabase
          .from("activity_logs")
          .select("id, customer_id, action, result, metadata, created_at")
          .in("action", EMAIL_ACTIONS)
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
            event: r.action,
            customer: r.customer_id ? companyBy[r.customer_id] || "—" : null,
            detail: r.metadata?.detail || r.metadata?.message || r.result || "",
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
