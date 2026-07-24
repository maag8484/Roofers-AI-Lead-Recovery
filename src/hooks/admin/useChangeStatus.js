import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// Calls the atomic admin_change_customer_status RPC. All four writes (status
// update + history + audit + activity) happen server-side in one transaction;
// this hook makes exactly ONE client call — no client-side companion writes,
// which is what keeps the three log tables in lockstep.
export function useChangeStatus() {
  const [saving, setSaving] = useState(false);

  const change = useCallback(async (customerId, toStatus, note) => {
    setSaving(true);
    try {
      const { error } = await supabase.rpc("admin_change_customer_status", {
        p_customer_id: customerId,
        p_to_status: toStatus,
        p_note: note?.trim() || null,
      });
      if (error) {
        // Surface the RPC's own message (e.g. "already in status", "Not authorized").
        return { ok: false, message: error.message };
      }
      return { ok: true };
    } finally {
      setSaving(false);
    }
  }, []);

  return { change, saving };
}
