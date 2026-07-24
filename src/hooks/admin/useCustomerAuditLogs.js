import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// 20 most recent audit_logs for one customer (entity_type roofing_companies,
// entity_id = customer id), newest first.
export function useCustomerAuditLogs(customerId, refreshKey) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!customerId) return;
    let active = true;
    setLoading(true);
    supabase
      .from("audit_logs")
      .select("id, actor_id, field, old_value, new_value, created_at")
      .eq("entity_type", "roofing_companies")
      .eq("entity_id", customerId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data: rows, error: err }) => {
        if (!active) return;
        if (err) setError(err);
        else setData(rows ?? []);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [customerId, refreshKey]);

  return { data, loading, error };
}
