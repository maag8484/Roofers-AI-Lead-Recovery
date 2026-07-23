import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { rangeSince } from "@/lib/dateRange";

// Server-paginated activity_logs with server-side filters. created_at desc
// fixed. Company name + admin name resolved via batch lookup (LEFT-join).
export function useActivityLogs({ page, pageSize, actions, performedBy, customerSearch, range, result }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Customer search -> resolve matching company ids first (separate table).
      let customerIds = null;
      if (customerSearch?.trim()) {
        const { data: cos } = await supabase
          .from("roofing_companies")
          .select("id")
          .ilike("company_name", `%${customerSearch.trim()}%`)
          .limit(500);
        customerIds = (cos ?? []).map((c) => c.id);
        if (customerIds.length === 0) {
          setRows([]);
          setTotal(0);
          setLoading(false);
          return;
        }
      }

      let q = supabase
        .from("activity_logs")
        .select("id, customer_id, action, performed_by, result, status, metadata, created_at", {
          count: "exact",
        })
        .order("created_at", { ascending: false });

      if (actions?.length) q = q.in("action", actions);
      if (performedBy?.length) q = q.in("performed_by", performedBy);
      if (customerIds) q = q.in("customer_id", customerIds);
      if (result === "success") q = q.eq("result", "OK");
      else if (result === "error") q = q.eq("result", "ERROR");
      const since = rangeSince(range);
      if (since) q = q.gte("created_at", since);

      const from = page * pageSize;
      q = q.range(from, from + pageSize - 1);

      const { data, count, error: qErr } = await q;
      if (qErr) throw qErr;

      const logs = data ?? [];
      const companyIds = [...new Set(logs.map((l) => l.customer_id).filter(Boolean))];
      const adminIds = [...new Set(logs.map((l) => l.performed_by).filter(Boolean))];

      const [companyBy, adminBy] = await Promise.all([
        indexNames("roofing_companies", "id", "company_name", companyIds),
        indexNames("profiles", "id", "full_name", adminIds),
      ]);

      setRows(
        logs.map((l) => ({
          ...l,
          company: l.customer_id ? companyBy[l.customer_id] || "—" : null,
          performedByName: l.performed_by ? adminBy[l.performed_by] || "Admin" : "System",
        }))
      );
      setTotal(count ?? 0);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actions, performedBy, customerSearch, range, result]);

  useEffect(() => {
    run();
  }, [run]);

  return { rows, total, loading, error, refetch: run };
}

async function indexNames(table, key, nameCol, ids) {
  if (!ids.length) return {};
  const { data } = await supabase.from(table).select(`${key}, ${nameCol}`).in(key, ids);
  const out = {};
  (data ?? []).forEach((r) => (out[r[key]] = r[nameCol]));
  return out;
}
