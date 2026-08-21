import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Local YYYY-MM-DD key so buckets line up with the admin's calendar days
// (toISOString() would bucket by UTC and shift evening signups to "tomorrow").
function dayKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Daily signup counts over a rolling window. Only created_at is fetched (one
// column, bounded by the window) and bucketed client-side — Postgres date_trunc
// grouping isn't reachable through PostgREST without a dedicated RPC/view.
export function useSignupTrend(days = 30) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - (days - 1));

        const { data: rows, error: e } = await supabase
          .from("roofing_companies")
          .select("created_at")
          .gte("created_at", start.toISOString())
          .order("created_at", { ascending: true });
        if (e) throw e;

        // Pre-seed every day in the window so gaps render as zero, not as a
        // missing point that would distort the line.
        const buckets = new Map();
        for (let i = 0; i < days; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          buckets.set(dayKey(d), { date: d, key: dayKey(d), value: 0 });
        }

        (rows ?? []).forEach((r) => {
          const b = buckets.get(dayKey(new Date(r.created_at)));
          if (b) b.value += 1;
        });

        if (!active) return;
        const series = [...buckets.values()];
        setData(series);
        setTotal(series.reduce((s, p) => s + p.value, 0));
      } catch (err) {
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [days]);

  return { data, total, loading, error };
}
