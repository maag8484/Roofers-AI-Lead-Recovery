import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// 20 most recent activity_logs for one customer, newest first.
export function useCustomerActivityLogs(customerId, refreshKey) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!customerId) return;
    let active = true;
    setLoading(true);
    supabase
      .from("activity_logs")
      .select("id, action, result, status, metadata, created_at")
      .eq("customer_id", customerId)
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
