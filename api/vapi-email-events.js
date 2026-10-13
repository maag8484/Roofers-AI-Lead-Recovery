import crypto from 'node:crypto';
import { database, json, UUID, validEmail } from '../server/vapi-followup.js';

export const config = { api: { bodyParser: false } };
export function verifySignature(raw, headers, publicKey) {
  try {
    const timestamp = headers['x-twilio-email-event-webhook-timestamp'];
    const signature = headers['x-twilio-email-event-webhook-signature'];
    if (typeof timestamp !== 'string' || !/^\d{1,12}$/.test(timestamp) || typeof signature !== 'string') return false;
    const key = crypto.createPublicKey({ key: Buffer.from(publicKey, 'base64'), format: 'der', type: 'spki' });
    return key.asymmetricKeyType === 'ec' && crypto.verify('sha256', Buffer.concat([Buffer.from(timestamp), raw]), key, Buffer.from(signature, 'base64'));
  } catch { return false; }
}
export function createHandler({ env = process.env, fetcher = fetch } = {}) {
  return async (req, res) => {
    if (req.method !== 'POST') return json(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    if (!env.SENDGRID_EVENT_PUBLIC_KEY || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json(res, 503, { error: 'EVENTS_NOT_CONFIGURED' });
    try {
      const chunks = []; let bytes = 0;
      for await (const chunk of req) {
        bytes += Buffer.byteLength(chunk);
        if (bytes > 1024 * 1024) return json(res, 413, { error: 'PAYLOAD_TOO_LARGE' });
        chunks.push(Buffer.from(chunk));
      }
      const raw = Buffer.concat(chunks);
      if (!verifySignature(raw, req.headers, env.SENDGRID_EVENT_PUBLIC_KEY)) return json(res, 401, { error: 'INVALID_SIGNATURE' });
      let events;
      try { events = JSON.parse(raw.toString('utf8')); } catch { return json(res, 400, { error: 'INVALID_JSON' }); }
      if (!Array.isArray(events) || events.length > 1000) return json(res, 400, { error: 'INVALID_EVENTS' });
      const db = database(env, fetcher);
      for (const event of events) {
        // Ignore unrelated account email. Signed retries deduplicate in SQL;
        // no narrow timestamp window that would reject delayed provider retries.
        if (!UUID.test(event.roof_ai_followup_id || '') || !validEmail(event.email) ||
            typeof event.sg_event_id !== 'string' || !event.sg_event_id || event.sg_event_id.length > 512 ||
            !Number.isFinite(event.timestamp) || event.timestamp <= 0 || event.timestamp > Date.now()/1000+300) continue;
        await db('rpc/record_vapi_delivery_event', 'POST', { p_event: {
          delivery_id: event.roof_ai_followup_id, email: event.email.toLowerCase(), event_id: event.sg_event_id,
          event: event.event, timestamp: event.timestamp,
        } });
      }
      return json(res, 200, { received: true });
    } catch { return json(res, 503, { error: 'EVENT_PROCESSING_FAILED' }); }
  };
}
export default createHandler();
