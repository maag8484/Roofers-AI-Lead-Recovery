import { invokeFunction } from "@/lib/supabase";

// ============================================================================
// EMAIL SEND SITES — feature-flagged production email, routed through gmail-send.
//
// THIS FILE IS THE COPYABLE PATTERN for adding real customer-facing email sends
// that flow through the Phase-5 health-monitored pipe. Each "site" is one
// trigger point. A site is controlled by a VITE_ env flag that DEFAULTS OFF; the
// flag-off branch is a PURE NO-OP (no send, no log, no warning) so the old
// behavior is exactly unchanged until you flip the flag in production.
//
// IMPORTANT: there are currently NO real customer email sends in this repo — all
// transactional email lives in n8n. The single site below is an EXAMPLE showing
// the pattern; it does nothing unless its flag is turned on.
// ============================================================================

// Registry of send sites, for the Email & Integrations dashboard indicator.
export const EMAIL_SITES = [
  {
    key: "STATUS_LIVE",
    label: "Customer went Live",
    description: "Emails the customer when their status changes to LIVE.",
    flagEnv: "VITE_USE_GMAIL_SEND_FOR_STATUS_LIVE",
  },
];

// True when a site's flag is enabled. import.meta.env values are strings.
export function isSiteEnabled(flagEnv) {
  const v = import.meta.env[flagEnv];
  return v === "true" || v === "1";
}

// ---------------------------------------------------------------------------
// EXAMPLE SITE — "email the customer when status becomes LIVE".
//
// Flag: VITE_USE_GMAIL_SEND_FOR_STATUS_LIVE  (default OFF)
//   OFF -> returns immediately, does NOTHING (pure no-op).
//   ON  -> calls gmail-send with metadata.site = 'STATUS_LIVE'.
//
// To add a REAL site later: copy this function, give it a new flag + site key,
// register it in EMAIL_SITES above, and call it from the relevant trigger.
// ---------------------------------------------------------------------------
export async function maybeSendStatusLiveEmail({ to, companyName }) {
  if (!isSiteEnabled("VITE_USE_GMAIL_SEND_FOR_STATUS_LIVE")) {
    return; // flag off -> no-op, old behavior unchanged
  }
  if (!to) return;

  try {
    await invokeFunction("gmail-send", {
      to,
      subject: "You're live with Roof AI Lead Recovery 🎉",
      text: `Hi ${companyName || "there"} — your AI receptionist is now live and recovering missed calls 24/7.`,
      metadata: { site: "STATUS_LIVE" },
    });
  } catch (err) {
    // Never let an email failure break the status-change UX.
    console.error("[email:STATUS_LIVE] send failed", err);
  }
}
