import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// Server-paginated billing view: roofing_companies with their subscription
// (resolved by user_id). Customers with no subscription still render ("No
// Subscription"). filter maps to subscriptions.status. search: company.
const STATUS_CHIP = {
  active: ["active"],
  trialing: ["trialing"],
  canceled: ["canceled"],
  past_due: ["past_due"],
};

export function useBilling({ page, pageSize, filter, search }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [kpis, setKpis] = useState({ active: 0, trialing: 0, canceled30: 0, mrr: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // KPIs. NOTE: MRR is single-plan math ($299 * active). Revisit when plans expand.
      const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const [active, trialing, canceled30] = await Promise.all([
        supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "trialing"),
        supabase
          .from("subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("status", "canceled")
          .gte("updated_at", since30),
      ]);
      const activeCount = active.count ?? 0;
      setKpis({
        active: activeCount,
        trialing: trialing.count ?? 0,
        canceled30: canceled30.count ?? 0,
        mrr: activeCount * 299,
      });

      // If a status filter is set, resolve matching user_ids first.
      let filterUserIds = null;
      if (STATUS_CHIP[filter]) {
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("user_id")
          .in("status", STATUS_CHIP[filter]);
        filterUserIds = [...new Set((subs ?? []).map((s) => s.user_id))];
        if (filterUserIds.length === 0) {
          setRows([]);
          setTotal(0);
          setLoading(false);
          return;
        }
      }

      let q = supabase
        .from("roofing_companies")
        .select("id, user_id, company_name", { count: "exact" })
        .order("created_at", { ascending: false });
      if (search?.trim()) q = q.ilike("company_name", `%${search.trim()}%`);
      if (filterUserIds) q = q.in("user_id", filterUserIds);

      const from = page * pageSize;
      q = q.range(from, from + pageSize - 1);
      const { data, count, error: qErr } = await q;
      if (qErr) throw qErr;

      const companies = data ?? [];
      const userIds = [...new Set(companies.map((c) => c.user_id).filter(Boolean))];
      const [subByU, profByU] = await Promise.all([
        idxBy("subscriptions", "user_id", "user_id, status, current_period_end, stripe_customer_id", userIds),
        idxBy("profiles", "id", "id, full_name", userIds),
      ]);

      setRows(
        companies.map((c) => ({
          id: c.id,
          company: c.company_name,
          owner: profByU[c.user_id]?.full_name || "—",
          status: subByU[c.user_id]?.status ?? null,
          periodEnd: subByU[c.user_id]?.current_period_end ?? null,
          stripeId: subByU[c.user_id]?.stripe_customer_id ?? null,
        }))
      );
      setTotal(count ?? 0);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filter, search]);

  useEffect(() => {
    run();
  }, [run]);

  return { rows, total, kpis, loading, error };
}

async function idxBy(table, key, cols, ids) {
  if (!ids.length) return {};
  const { data } = await supabase.from(table).select(cols).in(key, ids);
  const out = {};
  (data ?? []).forEach((r) => (out[r[key]] = r));
  return out;
}

// "In 5 days" / "Ended 3 days ago" from a period-end ISO.
export function renewalLabel(iso) {
  if (!iso) return "—";
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.round(Math.abs(diff) / 86_400_000);
  if (diff >= 0) return days === 0 ? "Today" : `In ${days} day${days === 1 ? "" : "s"}`;
  return `Ended ${days} day${days === 1 ? "" : "s"} ago`;
}
