import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

/**
 * Resolves where a logged-in customer should "continue" to, based on how far
 * through setup they are:
 *   not paid                     -> /checkout
 *   paid but no details form yet -> /onboarding
 *   done (or admin)              -> /dashboard   (admins -> /admin)
 *
 * Returns { path, ready }. `ready` is false until the subscription lookup
 * resolves, so callers can avoid flashing the wrong destination.
 */
export function useResumePath() {
  const { user, profile, isAdmin } = useAuth();
  const [subStatus, setSubStatus] = useState(undefined); // undefined = loading

  useEffect(() => {
    if (!user) {
      setSubStatus(null);
      return;
    }
    let active = true;
    supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setSubStatus(data?.status ?? null);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const ready = !user || subStatus !== undefined;

  let path = "/dashboard";
  if (isAdmin) {
    path = "/admin";
  } else if (!["active", "trialing"].includes(subStatus)) {
    path = "/checkout";
  } else if (!profile?.details_submitted) {
    path = "/onboarding";
  }

  return { path, ready };
}
