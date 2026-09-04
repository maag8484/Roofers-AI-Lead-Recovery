const TIMEOUT_MS = 8_000;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).setHeader("Allow", "GET").json({ ok: false });
  const expected = process.env.CRON_SECRET;
  if (!expected || req.headers.authorization !== `Bearer ${expected}`) {
    return res.status(401).json({ ok: false });
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(503).json({ ok: false });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/purge_expired_audit_requests`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: "{}",
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(502).json({ ok: false });
    return res.status(200).json({ ok: true, result });
  } catch {
    return res.status(502).json({ ok: false });
  } finally {
    clearTimeout(timeout);
  }
}
