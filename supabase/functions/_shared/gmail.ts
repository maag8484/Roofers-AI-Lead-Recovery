// Gmail helpers shared by gmail-send and gmail-health-check.
// - refreshAccessToken: exchanges the stored refresh_token for a fresh access
//   token (Google short-lives access tokens ~1h). Throws on failure so callers
//   can flip the singleton to NEEDS_REAUTH.
// - sendGmail: base64url-encodes an RFC-822 message and POSTs to the Gmail API.
import { decrypt } from "./supabase.ts";

const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

export interface RefreshResult {
  access_token: string;
  expires_in: number; // seconds
}

// Refresh using the ENCRYPTED refresh token stored on the singleton. Decrypts,
// calls Google's token endpoint. Throws with a descriptive message on failure
// (e.g. invalid_grant when the refresh token was revoked/corrupted) — that is
// the signal the health check turns into NEEDS_REAUTH.
export async function refreshAccessToken(encryptedRefreshToken: string): Promise<RefreshResult> {
  if (!encryptedRefreshToken) throw new Error("no_refresh_token");

  let refreshToken: string;
  try {
    refreshToken = await decrypt(encryptedRefreshToken);
  } catch {
    // Corrupted/undecryptable stored token — treat as a hard reauth condition.
    throw new Error("refresh_token_decrypt_failed");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`refresh_failed:${data.error ?? res.status}`);
  }
  return { access_token: data.access_token, expires_in: data.expires_in ?? 3600 };
}

// Build a base64url-encoded RFC-822 message and send it via the Gmail API.
// Returns the Gmail message id on success.
export async function sendGmail(
  accessToken: string,
  from: string,
  to: string,
  subject: string,
  body: string
): Promise<string | null> {
  const raw =
    `From: ${from}\r\n` +
    `To: ${to}\r\n` +
    `Subject: ${subject}\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Type: text/plain; charset="UTF-8"\r\n\r\n` +
    body;

  const encoded = btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encoded }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`gmail_send_failed:${res.status}:${err.slice(0, 200)}`);
  }
  const data = await res.json().catch(() => ({}));
  return data.id ?? null;
}
