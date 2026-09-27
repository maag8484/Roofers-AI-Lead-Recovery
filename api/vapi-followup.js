import { authenticated, database, Hold, json, providerSuppressionCheck, requireCondition,
  signupEmail, UUID, validateSource, validateSuppressionCheck, validEmail } from "../server/vapi-followup.js";

export function createHandler({ env = process.env, fetcher = fetch, clock = Date.now } = {}) {
  return async function handler(req, res) {
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); return json(res, 405, { error: "METHOD_NOT_ALLOWED" }); }
    if (!authenticated(req.headers.authorization, env.VAPI_FOLLOWUP_TOKEN)) return json(res, 401, { error: "UNAUTHORIZED" });
    const mode = env.VAPI_FOLLOWUP_MODE;
    if (!["test", "live"].includes(mode)) return json(res, 503, { error: "HANDOFF_DISABLED" });
    // Preview deployments never deliver to prospects, even if production values
    // were accidentally inherited by their environment.
    if (mode === "live" && env.VERCEL_ENV !== "production") return json(res, 503, { error: "LIVE_REQUIRES_PRODUCTION" });
    const from = env.VAPI_FOLLOWUP_FROM;
    if (![env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, env.VAPI_PRIVATE_API_KEY, env.SENDGRID_API_KEY].every(Boolean) || !validEmail(from)) {
      return json(res, 503, { error: "HANDOFF_NOT_CONFIGURED" });
    }
    const db = database(env, fetcher);
    let claimedId;
    try {
      requireCondition(Buffer.byteLength(JSON.stringify(req.body ?? {})) <= 4096, "PAYLOAD_TOO_LARGE", 413);
      const callId = req.body?.source_call_id;
      requireCondition(UUID.test(callId || ""), "CALL_ID_INVALID", 400);
      const provider = await fetcher(`https://api.vapi.ai/call/${callId}`, {
        headers: { Authorization: `Bearer ${env.VAPI_PRIVATE_API_KEY}` }, signal: AbortSignal.timeout(8000),
      });
      requireCondition(provider.ok, "CALL_LOOKUP_FAILED", 503);
      const call = await provider.json();
      requireCondition(call.id === callId, "CALL_ID_MISMATCH");
      let audit = null;
      if (mode === "live") {
        const requestId = call.metadata?.audit_request_id;
        requireCondition(UUID.test(requestId || ""), "CALL_REQUEST_ID_MISSING");
        const rows = await db(`audit_requests?id=eq.${requestId}&select=*`);
        requireCondition(Array.isArray(rows) && rows.length === 1, "AUDIT_REQUEST_NOT_FOUND");
        audit = rows[0];
      }
      const row = validateSource(call, audit, { mode, testTo: env.VAPI_FOLLOWUP_TEST_TO, now: clock() });
      validateSuppressionCheck(req.body?.suppression_check, row, clock());
      await providerSuppressionCheck(row.recipient, env, fetcher);
      // Recheck the attestation after network lookups, immediately before the
      // atomic claim. Missing/stale revocation or cross-channel checks block.
      validateSuppressionCheck(req.body?.suppression_check, row, clock());
      const claim = await db("rpc/claim_vapi_signup_delivery", "POST", { p_delivery: row });
      requireCondition(claim && typeof claim.claimed === "boolean", "CLAIM_RESULT_INVALID", 503);
      if (!claim.claimed) return json(res, 200, { dispatched: false, duplicate_or_blocked: true, status: claim.status });
      requireCondition(UUID.test(claim.id || ""), "CLAIM_ID_INVALID", 503);
      claimedId = claim.id;
      // No retries around this non-idempotent provider POST. A timeout or process
      // crash retains the durable claim for reconciliation, never automatic resend.
      let sent;
      try {
        sent = await fetcher(`${env.SENDGRID_API_BASE_URL || "https://api.sendgrid.com"}/v3/mail/send`, {
          method: "POST", headers: { Authorization: `Bearer ${env.SENDGRID_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify(signupEmail(row, claimedId, from)), signal: AbortSignal.timeout(5000),
        });
      } catch {
        await db("rpc/finish_vapi_signup_delivery", "POST", { p_id: claimedId, p_status: "delivery_unknown", p_provider_id: null, p_http_status: null });
        return json(res, 502, { dispatched: false, status: "delivery_unknown", reconciliation_required: true });
      }
      const accepted = sent.status === 202;
      // 5xx is ambiguous: a provider may have accepted the work before erroring.
      const status = accepted ? "accepted" : sent.status >= 500 ? "delivery_unknown" : "rejected";
      await db("rpc/finish_vapi_signup_delivery", "POST", { p_id: claimedId, p_status: status,
        p_provider_id: sent.headers.get("x-message-id"), p_http_status: sent.status });
      return json(res, accepted ? 202 : 502, { dispatched: accepted, status, delivery_id: claimedId,
        delivered: false, ...(accepted ? {} : { reconciliation_required: true }) });
    } catch (error) {
      // Once claimed, every failure is non-retryable without reconciliation.
      // A DB outage after provider acceptance must not produce another send.
      if (claimedId) return json(res, 503, { error: "DELIVERY_RECONCILIATION_REQUIRED", delivery_id: claimedId });
      return json(res, error instanceof Hold ? error.status : 503, { error: error instanceof Hold ? error.code : "HANDOFF_DEPENDENCY_FAILED" });
    }
  };
}
export default createHandler();
