import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// Module-level dedup map so it survives component remounts within the session.
// KEY IS THE PAIR (admin_id::customer_id) — not just customer_id — so if two
// admins share a browser session, the second admin's view is still logged.
const lastViewByPair = new Map();
const DEDUP_MS = 5 * 60 * 1000;

// Logs a VIEWED_CUSTOMER activity_log on customer-detail mount, at most once per
// (admin, customer) per 5 minutes. Fire-and-forget; failures are non-fatal.
export function useLogCustomerView(customerId) {
  const { user } = useAuth();

  useEffect(() => {
    if (!customerId || !user?.id) return;
    const key = `${user.id}::${customerId}`;
    const now = Date.now();
    const last = lastViewByPair.get(key);
    if (last && now - last < DEDUP_MS) return; // recently viewed by THIS admin
    lastViewByPair.set(key, now);

    supabase
      .from("activity_logs")
      .insert({
        customer_id: customerId,
        action: "VIEWED_CUSTOMER",
        performed_by: user.id,
        result: "OK",
        status: "OK",
      })
      .then(({ error }) => {
        if (error) {
          console.error("[view log] failed", error.message);
          lastViewByPair.delete(key); // allow a retry on next mount
        }
      });
  }, [customerId, user]);
}
