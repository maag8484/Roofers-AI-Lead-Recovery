// ============================================================================
// Shared Stripe config — test/live mode switch in ONE place.
// ============================================================================
// STRIPE_MODE selects which set of secrets every Stripe function uses:
//
//   STRIPE_MODE = "test" (default)      -> STRIPE_SECRET_KEY
//                                          STRIPE_PRICE_ID
//                                          STRIPE_WEBHOOK_SECRET
//   STRIPE_MODE = "live"                -> STRIPE_SECRET_KEY_LIVE
//                                          STRIPE_PRICE_ID_LIVE
//                                          STRIPE_WEBHOOK_SECRET_LIVE
//
// To go live:   supabase secrets set STRIPE_MODE=live
// To go back:   supabase secrets set STRIPE_MODE=test   (or unset it)
//
// No redeploy needed to flip — functions read env at runtime. The LIVE secrets
// must be set before flipping, or the picked value is undefined and Stripe calls
// fail. Each live secret still requires its own live Stripe webhook endpoint.
// ============================================================================
import Stripe from "https://esm.sh/stripe@17?target=deno";

// Default to test so an unset/typo'd flag can never accidentally charge live
// cards. Only the exact string "live" switches to live.
const LIVE = (Deno.env.get("STRIPE_MODE") ?? "test").toLowerCase() === "live";

export const STRIPE_MODE: "live" | "test" = LIVE ? "live" : "test";

/** Read a secret from the *_LIVE variant when in live mode, else the base name. */
function pick(baseName: string): string {
  const name = LIVE ? `${baseName}_LIVE` : baseName;
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(
      `Missing Stripe secret ${name} (STRIPE_MODE=${STRIPE_MODE}). ` +
        `Set it with: supabase secrets set ${name}=...`,
    );
  }
  return value;
}

/** The mode-correct Stripe secret key (sk_test_… or sk_live_…). */
export const STRIPE_SECRET_KEY = pick("STRIPE_SECRET_KEY");

/** The mode-correct $299/mo recurring price id. Test and live price ids differ. */
export const STRIPE_PRICE_ID = pick("STRIPE_PRICE_ID");

/** The mode-correct webhook signing secret (whsec_…). Tied to the mode's endpoint. */
export const STRIPE_WEBHOOK_SECRET = pick("STRIPE_WEBHOOK_SECRET");

/** A ready-to-use Stripe client on the correct key. Import this everywhere. */
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});
