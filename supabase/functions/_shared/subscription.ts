import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Subscription row selection for edge functions.
 *
 * `subscriptions.user_id` carries an INDEX but no UNIQUE constraint (see
 * 0000_full_setup.sql), so one user legitimately owns several rows: a retried
 * checkout, a canceled plan Stripe left behind, a paused one.
 *
 * Every Stripe function used to do `.eq("user_id", …).maybeSingle()`, but
 * maybeSingle() treats "more than one row" as an ERROR and resolves data to
 * null — indistinguishable from "no rows". A paying customer with two rows was
 * therefore told "No subscription found." and 404'd out of the billing portal.
 *
 * Mirrors src/lib/subscription.js on the frontend — keep the two in sync.
 */

/** Live statuses, best first — an active plan outranks a trial. */
const PRIORITY = ["active", "trialing", "past_due", "paused", "incomplete", "canceled"];

/** Pick the row that should govern billing actions. */
export function pickActiveSubscription<T extends { status?: string }>(
  rows: T[] | null | undefined
): T | null {
  const list = (rows ?? []).filter(Boolean);
  if (list.length === 0) return null;
  if (list.length === 1) return list[0];

  for (const status of PRIORITY) {
    const hit = list.find((r) => r?.status === status);
    if (hit) return hit;
  }
  return list[0];
}

/**
 * Fetch the subscription row that governs billing for a user.
 *
 * @param db      service-role client
 * @param userId  the customer
 * @param columns columns to select (must include `status` and `created_at`)
 * @param requireField optional column that must be non-null (e.g.
 *        "stripe_customer_id") — rows lacking it are filtered out first, so a
 *        stale row without Stripe ids never shadows the usable one.
 */
export async function getGoverningSubscription(
  db: SupabaseClient,
  userId: string,
  columns: string,
  requireField?: string
) {
  const { data, error } = await db
    .from("subscriptions")
    .select(columns)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getGoverningSubscription failed", error.message);
    return null;
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const usable = requireField ? rows.filter((r) => r?.[requireField]) : rows;
  return pickActiveSubscription(usable as { status?: string }[]);
}
