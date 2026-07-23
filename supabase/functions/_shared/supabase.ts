import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/** Service-role client — bypasses RLS. Use only inside trusted edge functions. */
export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );
}

/** Resolve the authenticated user from the request's Authorization header. */
export async function getUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return { user: null, error: "Missing Authorization header" };

  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  return { user, error: error?.message ?? null };
}

/**
 * True if the given user id is in public.admins. Uses the service client so it
 * reads the admins table regardless of RLS. Used to authorize admin-only
 * actions (e.g. connecting a customer's calendar on their behalf).
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  const db = serviceClient();
  const { data, error } = await db
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("isAdminUser check failed", error.message);
    return false;
  }
  return !!data;
}

/**
 * AES-GCM encrypt/decrypt for tokens at rest.
 * TOKEN_ENCRYPTION_KEY must be a 32-byte base64 string.
 */
async function getKey(): Promise<CryptoKey> {
  const raw = Uint8Array.from(
    atob(Deno.env.get("TOKEN_ENCRYPTION_KEY")!),
    (c) => c.charCodeAt(0)
  );
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(plaintext);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc);
  const out = new Uint8Array(iv.length + cipher.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(cipher), iv.length);
  return btoa(String.fromCharCode(...out));
}

export async function decrypt(payload: string): Promise<string> {
  const key = await getKey();
  const bytes = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
  const iv = bytes.slice(0, 12);
  const data = bytes.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(plain);
}
