import crypto from 'node:crypto';

export const VERSION = 'roof-growth-v1';
export const CONSENT = 'I ask Roof AI Lead Recovery to review these business details and contact me by email about this request. This does not authorize marketing texts or AI phone calls.';
const SITE = 'https://www.roofaileadrecovery.com';
const str = (v, max = 150) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const uuid = v => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v || '');
const num = (v, min, max) => v !== '' && v != null && Number.isFinite(Number(v)) && Number(v) >= min && Number(v) <= max ? Number(v) : null;

export function qualify(input = {}) {
  const missed = num(input.missedCalls, 0, 10000);
  const legitimate = num(input.legitimateRate, 0, 100);
  const close = num(input.closeRate, 0, 100);
  const value = num(input.jobValue, 0, 1000000);
  const margin = num(input.margin, 0, 100);
  const dataComplete = [missed, legitimate, close, value, margin].every(v => v !== null);
  const jobs = dataComplete ? missed * legitimate / 100 * close / 100 : null;
  const gross = jobs === null ? null : Math.round(jobs * value);
  const contribution = jobs === null ? null : Math.round(jobs * value * margin / 100);
  let score = 0;
  if (input.isRoofer === 'yes') score += 30;
  if (['owner','manager'].includes(input.role)) score += 15;
  if (missed > 0) score += 20;
  if (['voicemail','manual','nothing'].includes(input.currentProcess)) score += 15;
  if (input.timing === 'now') score += 20;
  else if (input.timing === 'month') score += 10;
  if (input.isRoofer !== 'yes') score = 0;
  const fit = input.isRoofer !== 'yes' ? 'not-fit' : missed === 0 || !dataComplete || !(contribution > 0) ? 'audit-first' : score >= 70 ? 'trial-fit' : 'audit-first';
  return { score, fit, dataComplete, missedCalls: missed, legitimateRate: legitimate, closeRate: close, jobValue: value, margin, modeledJobs: jobs, modeledGross: gross, modeledContribution: contribution, breakEvenJobs: value && margin ? Math.ceil(299 / (value * margin / 100)) : null, disclaimer: 'An illustrative scenario based on your inputs, not measured losses, guaranteed recoveries, or net profit.' };
}

export function validate(input = {}) {
  const q = qualify(input);
  const errors = [];
  const data = {
    requestId: str(input.requestId, 36), fullName: str(input.fullName, 100), email: str(input.email, 254).toLowerCase(),
    company: str(input.company), serviceArea: str(input.serviceArea), phone: str(input.phone, 30),
    role: str(input.role, 20), isRoofer: str(input.isRoofer, 10), currentProcess: str(input.currentProcess, 30),
    timing: str(input.timing, 20), goal: str(input.goal, 20), heardAbout: str(input.heardAbout, 60),
    contactConsent: input.contactConsent === true, emailPlan: input.emailPlan === true,
    attribution: {}, qualification: q,
  };
  for (const key of ['fullName','company','serviceArea']) if (!data[key]) errors.push(key);
  if (!uuid(data.requestId)) errors.push('requestId');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || /[\r\n]/.test(data.email)) errors.push('email');
  if (data.phone && !/^\+?[\d\s().-]{7,30}$/.test(data.phone)) errors.push('phone');
  if (!data.contactConsent) errors.push('contactConsent');
  if (!['yes','no'].includes(data.isRoofer)) errors.push('isRoofer');
  if (!['owner','manager','team','other'].includes(data.role)) errors.push('role');
  if (!['voicemail','manual','nothing','covered'].includes(data.currentProcess)) errors.push('currentProcess');
  if (!['now','month','research'].includes(data.timing)) errors.push('timing');
  if (!['audit','trial','demo'].includes(data.goal)) errors.push('goal');
  if (!q.dataComplete) errors.push('calculator');
  for (const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']) {
    const v = str(input.attribution?.[key], 80);
    // Attribution is a campaign label, never a place for emails, phone numbers or URLs.
    if (v && /^[a-zA-Z0-9 _.-]+$/.test(v) && !/\d{7,}/.test(v)) data.attribution[key] = v;
  }
  data.attribution.landing_page = '/recover.html';
  return { data, errors };
}

function json(res, code, data) {
  res.statusCode = code;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.end(JSON.stringify(data));
}
function sameOrigin(req) {
  if (!req.headers.origin) return true;
  try { return new URL(req.headers.origin).host === (req.headers['x-forwarded-host'] || req.headers.host); } catch { return false; }
}
function headers(token) {
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const h = { apikey: key, 'Content-Type':'application/json' };
  if (token || key.startsWith('eyJ')) h.Authorization = `Bearer ${token || key}`;
  return h;
}
async function db(path, options = {}, token) {
  const base = (process.env.SUPABASE_URL || '').trim().replace(/\/$/,'');
  const response = await fetch(`${base}/rest/v1/${path}`, { ...options, headers: { ...headers(token), ...options.headers }, signal: AbortSignal.timeout(8000) });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw Object.assign(new Error('DATABASE_UNAVAILABLE'), { status: response.status });
  return body;
}
async function isAdmin(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer /i,'');
  if (!token) return false;
  const base = (process.env.SUPABASE_URL || '').trim().replace(/\/$/,'');
  const auth = await fetch(`${base}/auth/v1/user`, { headers: headers(token), signal: AbortSignal.timeout(5000) });
  if (!auth.ok || !(await auth.json()).id) return false;
  return await db('rpc/is_admin', { method:'POST', body:'{}' }, token) === true;
}
const cash = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n || 0);
export function planText(data, id) {
  const q = data.qualification;
  return [
    `Hi ${data.fullName},`, '', 'Here is the Roof AI missed-call scenario you requested.', '',
    `Company: ${data.company}`, `Request: ${id}`, `Missed calls per month: ${q.missedCalls}`,
    `Legitimate opportunity rate: ${q.legitimateRate}%`, `Assumed close rate: ${q.closeRate}%`,
    `Average job revenue: ${cash(q.jobValue)}`, `Job contribution margin: ${q.margin}%`,
    `Modeled gross opportunity: ${cash(q.modeledGross)}/month`, `Modeled contribution before overhead and service costs: ${cash(q.modeledContribution)}/month`,
    '', q.disclaimer, '', 'Next step: verify these assumptions against your recent call log. Check which calls were genuine opportunities, which received a response, and which became paid jobs.',
    '', `Your on-demand demonstration and signup path: ${SITE}/recover.html`,
    'The current advertised offer is a 7-day free trial followed by $299/month. Review the actual checkout terms, taxes and cancellation details before subscribing.',
    '', 'This is the single plan email you explicitly requested. You have not been added to an automated marketing sequence, SMS list, or AI calling campaign.',
    'Reply to this message with a correction or a request about your audit.', '', 'Roof AI Lead Recovery',
  ].join('\n');
}
async function sendPlan(data, id) {
  const key = (process.env.SENDGRID_API_KEY || '').trim().replace(/^(["'])(.*)\1$/s,'$2').trim();
  if (!key) return 'not_configured';
  const from = (process.env.AUDIT_NOTIFICATION_FROM || process.env.SENDGRID_FROM_EMAIL || 'support@roofaileadrecovery.com').trim();
  const reply = 'cory@roofaileadrecovery.com';
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method:'POST', headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'}, signal:AbortSignal.timeout(6000),
      body:JSON.stringify({ personalizations:[{to:[{email:data.email}]}], from:{email:from,name:'Roof AI Lead Recovery'}, reply_to:{email:reply}, subject:'Your requested Roof AI missed-call plan', content:[{type:'text/plain',value:planText(data,id)}], tracking_settings:{click_tracking:{enable:false,enable_text:false},open_tracking:{enable:false}} }),
    });
    return response.status === 202 ? 'accepted' : 'failed';
  } catch { return 'failed'; }
}
export default async function handler(req, res) {
  try {
    const action = req.query?.action || new URL(req.url || '/', 'http://local').searchParams.get('action') || '';
    if (req.method === 'GET' && action === 'health') {
      const configured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.AUDIT_RATE_LIMIT_SALT);
      if (!configured) return json(res,503,{ok:false,version:VERSION,error:'NOT_CONFIGURED'});
      await db('roof_growth_leads?select=id&limit=0');
      return json(res,200,{ok:true,version:VERSION,intake:'ready',planEmail:process.env.SENDGRID_API_KEY ? 'configured_not_delivery_verified':'not_configured',automatedNurture:false,liveCalendarBooking:false,revenueVerification:'not_connected'});
    }
    if (req.method === 'GET' && action === 'pipeline') {
      if (!await isAdmin(req)) return json(res,401,{ok:false,error:'ADMIN_LOGIN_REQUIRED'});
      const [leads, summary] = await Promise.all([
        db('roof_growth_leads?select=id,audit_request_id,full_name,email,company,service_area,score,fit,goal,stage,attribution,plan_email_status,created_at&order=created_at.desc&limit=200'),
        db('rpc/roof_growth_summary',{method:'POST',body:'{}'}),
      ]);
      return json(res,200,{ok:true,leads,summary,limit:200,revenue:{verifiedCollected:null,status:'not_connected'},automatedNurture:false});
    }
    if (req.method === 'PATCH') {
      if (!sameOrigin(req) || !await isAdmin(req)) return json(res,403,{ok:false,error:'FORBIDDEN'});
      const stages = ['new','reviewing','contacted','replied','trial_interest','closed','not_fit'];
      if (!uuid(req.body?.id) || !stages.includes(req.body?.stage)) return json(res,400,{ok:false,error:'INVALID_STAGE'});
      const rows = await db(`roof_growth_leads?id=eq.${req.body.id}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({stage:req.body.stage,updated_at:new Date().toISOString()})});
      return json(res,rows.length ? 200:404,{ok:Boolean(rows.length)});
    }
    if (req.method !== 'POST') { res.setHeader('Allow','GET, POST, PATCH'); return json(res,405,{ok:false,error:'METHOD_NOT_ALLOWED'}); }
    if (!sameOrigin(req)) return json(res,403,{ok:false,error:'ORIGIN_NOT_ALLOWED'});
    let input = req.body;
    if (typeof input === 'string') { if (Buffer.byteLength(input)>16384) return json(res,413,{ok:false,error:'BODY_TOO_LARGE'}); try { input=JSON.parse(input); } catch { return json(res,400,{ok:false,error:'INVALID_JSON'}); } }
    if (!input || typeof input !== 'object' || Array.isArray(input)) return json(res,400,{ok:false,error:'INVALID_BODY'});
    if (Buffer.byteLength(JSON.stringify(input)) > 16384) return json(res,413,{ok:false,error:'BODY_TOO_LARGE'});
    if (str(input.website,200)) return json(res,202,{ok:true,saved:false});
    const {data,errors} = validate(input);
    if (errors.length) return json(res,400,{ok:false,error:'VALIDATION_ERROR',fields:errors});
    // QA exercises validation and routing but creates no lead, notification or email.
    if (input.qa === true || process.env.VERCEL_ENV !== 'production') return json(res,200,{ok:true,saved:false,simulation:true,qualification:data.qualification,emailStatus:'not_sent',nextUrl:'/signup'});
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.AUDIT_RATE_LIMIT_SALT) return json(res,503,{ok:false,error:'NOT_CONFIGURED'});
    const hmac = v => crypto.createHmac('sha256',process.env.AUDIT_RATE_LIMIT_SALT).update(v).digest('hex');
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
    const q = data.qualification;
    const audit = {full_name:data.fullName,email:data.email,company:data.company,service_area:data.serviceArea,phone:data.phone || null,preferred_contact:'email',current_process:`[GROWTH v1] Role=${data.role}; process=${data.currentProcess}; timing=${data.timing}; goal=${data.goal}; fit=${q.fit}; score=${q.score}; heard=${data.heardAbout}. Requested review only; not a booked meeting.`,contact_consent:true,marketing_consent:false,consent_version:VERSION,consented_at:new Date().toISOString(),submission_page:SITE+'/recover.html',attribution:data.attribution,calculator:{missed_calls:q.missedCalls,legitimate_rate:q.legitimateRate,close_rate:q.closeRate,job_value:q.jobValue,monthly_risk:q.modeledGross,annual_risk:q.modeledGross*12},ai_demo_requested:false};
    const result = await db('rpc/submit_roof_growth_lead',{method:'POST',body:JSON.stringify({p_request_id:data.requestId,p_audit:audit,p_growth:{...data,consentText:CONSENT},p_rate_key:hmac('ip:'+ip),p_email_key:hmac('email:'+data.email)})});
    if (result?.error === 'RATE_LIMITED') return json(res,429,{ok:false,error:'RATE_LIMITED'});
    if (!result?.id) return json(res,502,{ok:false,error:'SAVE_FAILED'});
    let emailStatus = result.email_status || 'not_requested';
    // Only the transaction that inserted the request can send. Retrying cannot duplicate the email.
    if (data.emailPlan && result.is_new) {
      emailStatus = await sendPlan(data,result.id);
      try { await db(`roof_growth_leads?id=eq.${result.id}`,{method:'PATCH',body:JSON.stringify({plan_email_status:emailStatus})}); } catch { emailStatus='status_unconfirmed'; }
    }
    return json(res,result.is_new?201:200,{ok:true,saved:true,requestId:result.id,auditRequestId:result.audit_id,qualification:q,emailStatus,nextUrl:'/signup',duplicate:!result.is_new});
  } catch (error) {
    console.error('[roof-growth]',error?.message || 'REQUEST_FAILED');
    return json(res,502,{ok:false,error:'SERVICE_UNAVAILABLE'});
  }
}
