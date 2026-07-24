import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// "Recent" fallback shown when the search query is empty: the current admin's
// last 5 VIEWED_CUSTOMER activity rows (resolved to company names) + last 5
// unread notifications.
export function useRecentSearch(active) {
  const { user } = useAuth();
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [unread, setUnread] = useState([]);

  useEffect(() => {
    if (!active || !user) return;
    let alive = true;
    (async () => {
      const [{ data: views }, { data: notifs }] = await Promise.all([
        supabase
          .from("activity_logs")
          .select("customer_id, created_at")
          .eq("action", "VIEWED_CUSTOMER")
          .eq("performed_by", user.id)
          .order("created_at", { ascending: false })
          .limit(15),
        supabase
          .from("admin_notifications")
          .select("id, title, severity, metadata, created_at")
          .is("read_at", null)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      // Dedupe viewed customers, keep first 5, resolve names.
      const seen = new Set();
      const ids = [];
      (views ?? []).forEach((v) => {
        if (v.customer_id && !seen.has(v.customer_id)) {
          seen.add(v.customer_id);
          ids.push(v.customer_id);
        }
      });
      const top = ids.slice(0, 5);
      let byId = {};
      if (top.length) {
        const { data: cos } = await supabase
          .from("roofing_companies")
          .select("id, company_name")
          .in("id", top);
        (cos ?? []).forEach((c) => (byId[c.id] = c.company_name));
      }
      if (alive) {
        setRecentCustomers(top.map((id) => ({ id, company: byId[id] || "—" })));
        setUnread(notifs ?? []);
      }
    })();
    return () => {
      alive = false;
    };
  }, [active, user]);

  return { recentCustomers, unread };
}
