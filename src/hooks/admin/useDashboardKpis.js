import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Server-side count helper: SELECT count(*) executed by Postgres, returns only
// the number (head:true = no rows shipped). Never fetches lists to count.
async function count(table, build) {
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (build) q = build(q);
  const { count: c, error } = await q;
  if (error) throw error;
  return c ?? 0;
}

const PENDING = [
  "NEW",
  "WAITING_FOR_BUSINESS_INFO",
  "BUSINESS_INFO_SUBMITTED",
  "SETUP_IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "PENDING_REVIEW",
];
const COMPLETED = ["CONFIGURATION_COMPLETE", "AI_ACTIVATED", "LIVE"];
const AI_ON = ["AI_ACTIVATED", "LIVE"];

// ISO timestamps for rolling windows (computed once per call).
function windows() {
  const now = Date.now();
  const d = (ms) => new Date(now - ms).toISOString();
  const DAY = 86_400_000;
  return {
    d7: d(7 * DAY),
    d14: d(14 * DAY),
    h24: d(DAY),
    h48: d(2 * DAY),
  };
}

// Single hook for all count-based KPI cards. Each metric is its own server-side
// count query (no client aggregation); grouped here to avoid fragmenting into
// eight near-identical files and eight independent mount round-trips.
export function useDashboardKpis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const w = windows();
        const [
          total,
          activeLive,
          trial,
          pending,
          completed,
          aiActivated,
          signups7,
          signupsPrev7,
          appointments,
          emailsSent24,
          emailsSentPrev24,
          emailsFailed24,
          emailsFailedPrev24,
        ] = await Promise.all([
          count("roofing_companies"),
          count("roofing_companies", (q) => q.eq("current_status", "LIVE")),
          count("subscriptions", (q) => q.eq("status", "trialing")),
          count("roofing_companies", (q) => q.in("current_status", PENDING)),
          count("roofing_companies", (q) => q.in("current_status", COMPLETED)),
          count("roofing_companies", (q) => q.in("current_status", AI_ON)),
          count("roofing_companies", (q) => q.gte("created_at", w.d7)),
          count("roofing_companies", (q) =>
            q.gte("created_at", w.d14).lt("created_at", w.d7)
          ),
          count("appointments"),
          count("activity_logs", (q) =>
            q.eq("action", "EMAIL_SENT").gte("created_at", w.h24)
          ),
          count("activity_logs", (q) =>
            q.eq("action", "EMAIL_SENT").gte("created_at", w.h48).lt("created_at", w.h24)
          ),
          count("activity_logs", (q) =>
            q.eq("action", "EMAIL_SEND_FAILED").gte("created_at", w.h24)
          ),
          count("activity_logs", (q) =>
            q
              .eq("action", "EMAIL_SEND_FAILED")
              .gte("created_at", w.h48)
              .lt("created_at", w.h24)
          ),
        ]);

        if (!active) return;
        setData({
          total,
          activeLive,
          trial,
          pending,
          completed,
          aiActivated,
          signups7,
          signupsPrev7,
          appointments,
          emailsSent24,
          emailsSentPrev24,
          emailsFailed24,
          emailsFailedPrev24,
        });
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
