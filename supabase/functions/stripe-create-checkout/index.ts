// Retired: free pilots are activated after setup and a successful live test,
// without a card or an automatically converting Stripe subscription.
// Existing paid subscriptions continue through the billing portal/webhook.
import { handleOptions, json } from "../_shared/cors.ts";

Deno.serve((req) => {
  const pre = handleOptions(req);
  if (pre) return pre;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  return json({
    error: "legacy_checkout_retired",
    message: "Request the free 14-day pilot, up to 40 recovered calls, through signup. No card is required. Your pilot starts after setup and a successful live test and ends unless you explicitly choose paid continuation. Previously accepted offers retain their agreed terms.",
    next_path: "/signup",
  }, 410);
});
