import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// Server-paginated business-number view: roofing_companies LEFT-joined to
// twilio_accounts (customers without a number still render, "Not Assigned").
// filter: all | has | missing. search: company / owner / phone.
export function useBusinessNumbers({ page, pageSize, filter, search }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [kpis, setKpis] = useState({ assigned: 0, missing: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // KPIs (server-side counts).
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const [totalCustomers, twilioTotal, thisMonth] = await Promise.all([
        supabase.from("roofing_companies").select("*", { count: "exact", head: true }),
        supabase.from("twilio_accounts").select("*", { count: "exact", head: true }),
        supabase
          .from("twilio_accounts")
          .select("*", { count: "exact", head: true })
          .gte("created_at", monthStart.toISOString()),
      ]);
      const assigned = twilioTotal.count ?? 0;
      setKpis({
        assigned,
        missing: Math.max(0, (totalCustomers.count ?? 0) - assigned),
        thisMonth: thisMonth.count ?? 0,
      });

      // Base page over roofing_companies.
      let q = supabase
        .from("roofing_companies")
        .select("id, user_id, company_name, phone_country, business_phone, created_at", {
          count: "exact",
        })
        .order("created_at", { ascending: false });

      if (search?.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(`company_name.ilike.${s},business_phone.ilike.${s}`);
      }

      const from = page * pageSize;
      q = q.range(from, from + pageSize - 1);
      const { data, count, error: qErr } = await q;
      if (qErr) throw qErr;

      const companies = data ?? [];
      const userIds = [...new Set(companies.map((c) => c.user_id).filter(Boolean))];
      const [twByU, profByU] = await Promise.all([
        idxBy("twilio_accounts", "user_id", "user_id, phone_number, created_at", userIds),
        idxBy("profiles", "id", "id, full_name", userIds),
      ]);

      let mapped = companies.map((c) => ({
        id: c.id,
        company: c.company_name,
        owner: profByU[c.user_id]?.full_name || "—",
        number: twByU[c.user_id]?.phone_number ?? null,
        country: c.phone_country || "—",
        assignedAt: twByU[c.user_id]?.created_at ?? null,
      }));

      // "has"/"missing" filter applied after the join (join is client-resolved).
      if (filter === "has") mapped = mapped.filter((r) => r.number);
      else if (filter === "missing") mapped = mapped.filter((r) => !r.number);

      setRows(mapped);
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
