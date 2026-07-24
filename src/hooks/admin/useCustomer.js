import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// Full single-customer record for the detail page. Returns notFound=true when
// no roofing_companies row matches the id (drives the 404-style empty state).
export function useCustomer(id) {
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data: c, error: cErr } = await supabase
        .from("roofing_companies")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (cErr) throw cErr;
      if (!c) {
        setNotFound(true);
        setData(null);
        return;
      }

      const [{ data: profile }, { data: sub }, { data: tw }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone").eq("id", c.user_id).maybeSingle(),
        supabase
          .from("subscriptions")
          .select("status, current_period_start, current_period_end, stripe_customer_id, created_at")
          .eq("user_id", c.user_id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase.from("twilio_accounts").select("phone_number").eq("user_id", c.user_id).maybeSingle(),
      ]);

      setData({ company: c, profile: profile ?? null, subscription: sub ?? null, twilio: tw ?? null });
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, notFound, loading, error, refetch: load };
}
