export const PILOT_PROGRAM = 'roof-ai-pilot-01';
export const PILOT_TERMS_VERSION = 'pilot-14d-40calls-199-v3';
export const hasPilotRequest = (user) => user?.user_metadata?.pilot_program === PILOT_PROGRAM;
// Accepted offers are not shortened when the public offer changes.
export function pilotOffer(user) {
  const version = user?.user_metadata?.pilot_terms_version;
  const legacy = version === 'pilot-30d-40calls-v1' || version === 'pilot-14d-40calls-v2';
  const current = version === PILOT_TERMS_VERSION || !hasPilotRequest(user);
  const days = version === 'pilot-30d-40calls-v1' ? 30 : legacy || current ? 14 : null;
  const foundingRateUsd = legacy ? 149 : current ? 199 : null;
  return {
    days,
    foundingRateUsd,
    foundingRateLabel: foundingRateUsd ? `$${foundingRateUsd}/month` : "your previously quoted founding rate",
    title: days ? `Free ${days}-Day Pilot` : 'Free Pilot',
    duration: days ? `${days} days` : 'your agreed pilot period',
  };
}
export function referralCode(location = globalThis.location, storage) {
  const candidate = new URLSearchParams(location?.search || '').get('ref');
  const valid = (v) => typeof v === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(v);
  try {
    storage ??= globalThis.localStorage;
    if (valid(candidate)) storage?.setItem('roof_ai_partner_ref', candidate);
    const saved = storage?.getItem('roof_ai_partner_ref');
    return valid(candidate) ? candidate : valid(saved) ? saved : null;
  } catch { return valid(candidate) ? candidate : null; }
}
export function pilotMetadata(ref = referralCode()) {
  return { pilot_program: PILOT_PROGRAM, pilot_terms_version: PILOT_TERMS_VERSION,
    pilot_requested_at: new Date().toISOString(), partner_ref: ref };
}
