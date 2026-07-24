import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { rangeSince } from "@/lib/dateRange";

// Server-paginated audit_logs with server-side filters. created_at desc fixed.
// Actor name resolved via batch lookup.
export function useAuditLogs({ page, pageSize, entityTypes, actors, fieldSearch, range }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from("audit_logs")
        .select("id, actor_id, entity_type, entity_id, field, old_value, new_value, ip_address, created_at", {
          count: "exact",
        })
        .order("created_at", { ascending: false });

      if (entityTypes?.length) q = q.in("entity_type", entityTypes);
      if (actors?.length) q = q.in("actor_id", actors);
      if (fieldSearch?.trim()) q = q.ilike("field", `%${fieldSearch.trim()}%`);
      const since = rangeSince(range);
      if (since) q = q.gte("created_at", since);

      const from = page * pageSize;
      q = q.range(from, from + pageSize - 1);

      const { data, count, error: qErr } = await q;
      if (qErr) throw qErr;

      const logs = data ?? [];
      const actorIds = [...new Set(logs.map((l) => l.actor_id).filter(Boolean))];
      let actorBy = {};
      if (actorIds.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", actorIds);
        (profs ?? []).forEach((p) => (actorBy[p.id] = p.full_name));
      }

      setRows(logs.map((l) => ({ ...l, actorName: l.actor_id ? actorBy[l.actor_id] || "Admin" : "System" })));
      setTotal(count ?? 0);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, entityTypes, actors, fieldSearch, range]);

  useEffect(() => {
    run();
  }, [run]);

  return { rows, total, loading, error, refetch: run };
}
