import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { pickActiveSubscription } from "@/lib/subscription";

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
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const [subStatus, setSubStatus] = useState(undefined); // undefined = loading

  useEffect(() => {
    if (!user) {
      setSubStatus(null);
      return;
    }
    let active = true;
    // Several rows per user are possible — maybeSingle() would error on that
    // and report "no subscription", sending a paid user back to /checkout.
    supabase
      .from("subscriptions")
      .select("status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active) setSubStatus(pickActiveSubscription(data)?.status ?? null);
      });
    return () => {
      active = false;
    };
  }, [user]);

  // `profile` comes from AuthContext on its own timeline. Reading
  // details_submitted off a still-loading (null) profile would resolve to
  // /onboarding for a customer who already finished the form, so the caller
  // must not act until BOTH the subscription and the profile have settled.
  const ready = !user || (subStatus !== undefined && !authLoading);

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
