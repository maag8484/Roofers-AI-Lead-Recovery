// HMAC-signed, short-lived OAuth `state` token — CSRF protection for the
// JWT-off gmail-oauth-callback. The callback is anonymously reachable (Google
// redirects the browser there with no JWT), so a signed+expiring state is what
// proves the redirect originated from our own gmail-oauth-start.
//
// Key: OAUTH_STATE_SECRET if set (preferred — isolates the HMAC key from the
// token-encryption key), else falls back to TOKEN_ENCRYPTION_KEY.
//
// Format (all base64url, dot-separated):  <payloadB64>.<sigB64>
//   payload = { admin_id, redirect_to, iat, nonce }   (iat = unix seconds)
// The signature covers the exact payload bytes; verify recomputes and compares
// in constant time, then checks expiry.

const STATE_TTL_SECONDS = 300; // 5 minutes

function stateSecret(): string {
  return Deno.env.get("OAUTH_STATE_SECRET") ?? Deno.env.get("TOKEN_ENCRYPTION_KEY")!;
}

function b64urlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function hmacKey(): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(stateSecret());
  return crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

// NOTE: we intentionally take iat as a parameter rather than calling Date.now()
// here so callers control the clock (edge functions may run under test harnesses
// that stub time). In production, pass Math.floor(Date.now()/1000).
export async function signState(
  payload: { admin_id: string; redirect_to: string; nonce: string },
  iatSeconds: number
): Promise<string> {
  const body = JSON.stringify({ ...payload, iat: iatSeconds });
  const bodyBytes = new TextEncoder().encode(body);
  const key = await hmacKey();
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, bodyBytes));
  return `${b64urlEncode(bodyBytes)}.${b64urlEncode(sig)}`;
}

export type StateVerifyResult =
  | { ok: true; admin_id: string; redirect_to: string; iat: number }
  | { ok: false; reason: string };

export async function verifyState(
  state: string,
  nowSeconds: number
): Promise<StateVerifyResult> {
  if (!state || !state.includes(".")) return { ok: false, reason: "malformed_state" };
  const [payloadB64, sigB64] = state.split(".");
  let bodyBytes: Uint8Array;
  let sig: Uint8Array;
  try {
    bodyBytes = b64urlDecode(payloadB64);
    sig = b64urlDecode(sigB64);
  } catch {
    return { ok: false, reason: "decode_error" };
  }

  const key = await hmacKey();
  const valid = await crypto.subtle.verify("HMAC", key, sig, bodyBytes);
  if (!valid) return { ok: false, reason: "bad_signature" };

  let parsed: { admin_id?: string; redirect_to?: string; iat?: number };
  try {
    parsed = JSON.parse(new TextDecoder().decode(bodyBytes));
  } catch {
    return { ok: false, reason: "bad_payload" };
  }
  if (!parsed.admin_id || typeof parsed.iat !== "number") {
    return { ok: false, reason: "incomplete_payload" };
  }
  if (nowSeconds - parsed.iat > STATE_TTL_SECONDS) {
    return { ok: false, reason: "expired" };
  }
  if (parsed.iat - nowSeconds > 60) {
    // issued too far in the future — clock skew / tampering
    return { ok: false, reason: "future_iat" };
  }

  return {
    ok: true,
    admin_id: parsed.admin_id,
    redirect_to: parsed.redirect_to ?? "/admin/integrations/email",
    iat: parsed.iat,
  };
}
