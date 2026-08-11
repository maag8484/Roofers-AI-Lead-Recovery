/**
 * Subscription row selection.
 *
 * `subscriptions.user_id` has an INDEX but no UNIQUE constraint (see
 * 0000_full_setup.sql), so a user legitimately accumulates several rows —
 * a retried checkout, a canceled plan Stripe left behind, a paused one.
 *
 * Every caller used to do `.eq("user_id", …).maybeSingle()`, but maybeSingle()
 * treats "more than one row" as an ERROR and resolves `data` to null. A paying
 * customer with two rows therefore looked like they had never subscribed and
 * got bounced back to /checkout forever.
 *
 * Fix: fetch all the user's rows and pick the one that actually governs access.
 */

/** Live statuses, best first — an active plan outranks a trial. */
const PRIORITY = ["active", "trialing", "past_due", "paused", "incomplete", "canceled"];

/**
 * Pick the row that should drive access decisions.
 *
 * Prefers any live subscription (active > trialing > …) over a dead one, and
 * falls back to the newest row when nothing matches a known status — so an
 * unrecognised Stripe status still surfaces rather than silently vanishing.
 *
 * @param {Array|Object|null} rows result of the query (array), or a single row
 * @returns {Object|null} the governing subscription, or null if there are none
 */
export function pickActiveSubscription(rows, { requireField } = {}) {
  if (!rows) return null;
  let list = Array.isArray(rows) ? rows.filter(Boolean) : [rows];
  if (list.length === 0) return null;

  // When a field is required (e.g. stripe_subscription_id), rows lacking it are
  // dropped FIRST. Otherwise a stale row with a better-looking status shadows
  // the row Stripe actually acts on — the billing page would keep showing
  // "Active" after a successful pause, because pause only ever touches the row
  // that carries a Stripe id.
  if (requireField) {
    const usable = list.filter((r) => r?.[requireField]);
    if (usable.length > 0) list = usable;
  }

  if (list.length === 1) return list[0];

  for (const status of PRIORITY) {
    const hit = list.find((r) => r?.status === status);
    if (hit) return hit;
  }
  return list[0];
}

/** True when the subscription grants access to the app. */
export function isSubscriptionActive(sub) {
  return ["active", "trialing"].includes(sub?.status);
}
