import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ALL_STATUSES, STATUS_PROGRESSION } from "@/config/customerStatus";

// Customer counts per current_status. One column fetched for all rows and
// tallied client-side — 13 separate head-count queries would be 13 round-trips
// for the same answer, and the customer table is small (hundreds, not millions).
export function useStatusBreakdown() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: rows, error: e } = await supabase
          .from("roofing_companies")
          .select("current_status");
        if (e) throw e;

        const tally = {};
        (rows ?? []).forEach((r) => {
          const s = r.current_status;
          if (!s) return;
          tally[s] = (tally[s] ?? 0) + 1;
        });

        if (!active) return;
        // Keep enum order (pipeline order) so the chart reads NEW -> LIVE.
        setData(ALL_STATUSES.map((s) => ({ status: s, value: tally[s] ?? 0 })));
        setTotal(rows?.length ?? 0);
      } catch (err) {
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { data, total, loading, error, stages: STATUS_PROGRESSION };
}
