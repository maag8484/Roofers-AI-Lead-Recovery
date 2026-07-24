import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Populates the log-page filter dropdowns from REAL data (no hardcoded lists):
//   - distinct activity_logs.action  (or audit_logs.entity_type)
//   - the admin roster (id -> full_name) for the "performed by / actor" filter
// `column`/`table` pick which distinct set to fetch.
export function useLogFilterOptions({ table, column }) {
  const [values, setValues] = useState([]); // distinct actions or entity_types
  const [admins, setAdmins] = useState([]); // [{ id, name }]

  useEffect(() => {
    let active = true;
    (async () => {
      // Distinct set — pull a bounded window and dedupe client-side (Supabase
      // has no DISTINCT param; capping at 500 rows keeps this cheap and the
      // resulting option list is naturally small).
      const { data: rows } = await supabase
        .from(table)
        .select(column)
        .order("created_at", { ascending: false })
        .limit(500);
      if (active) {
        setValues([...new Set((rows ?? []).map((r) => r[column]).filter(Boolean))].sort());
      }

      // Admin roster: admins.user_id -> profiles.full_name.
      const { data: adminRows } = await supabase.from("admins").select("user_id");
      const ids = (adminRows ?? []).map((a) => a.user_id);
      let names = [];
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        names = (profs ?? []).map((p) => ({ id: p.id, name: p.full_name || p.id.slice(0, 8) }));
      }
      if (active) setAdmins(names);
    })();
    return () => {
      active = false;
    };
  }, [table, column]);

  return { values, admins };
}
