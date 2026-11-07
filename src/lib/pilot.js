export const PILOT_PROGRAM = 'roof-ai-pilot-01';
export const PILOT_TERMS_VERSION = 'pilot-14d-40calls-199-v3';
export const FOUNDING_CARD_TERMS_VERSION = 'pilot-14d-40calls-199-card-v4';
// Display only. Checkout independently verifies the full server-owned reservation.
export const hasFoundingCardOffer = (user) => !!user?.id && user?.app_metadata?.roof_founding_offer?.version === FOUNDING_CARD_TERMS_VERSION && user?.app_metadata?.roof_founding_offer?.user_id === user?.id;
export const hasPilotRequest = (user) => user?.user_metadata?.pilot_program === PILOT_PROGRAM;
// Accepted offers are not shortened when the public offer changes.
export function pilotOffer(user) {
  const cardFirst = hasFoundingCardOffer(user);
  const version = cardFirst ? FOUNDING_CARD_TERMS_VERSION : user?.user_metadata?.pilot_terms_version;
  const legacy = version === 'pilot-30d-40calls-v1' || version === 'pilot-14d-40calls-v2';
  const current = cardFirst || version === PILOT_TERMS_VERSION || !hasPilotRequest(user);
  const days = version === 'pilot-30d-40calls-v1' ? 30 : legacy || current ? 14 : null;
  const foundingRateUsd = legacy ? 149 : current ? 199 : null;
  return {
    cardFirst,
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

// Signup and a reserved offer are not evidence of activation or payment.
export function pilotAccountSummary(user, subscription) {
  const offer = pilotOffer(user);
  const activeSubscription = ['active', 'trialing'].includes(subscription?.status);
  if (offer.cardFirst) return {
    requested: !activeSubscription,
    progress: activeSubscription ? 'Subscription recorded' : 'Founding offer reserved — card authorization and activation checked separately',
    plan: 'Founding plan · $199/month for 12 paid months, then $299/month · 75 recovered calls per paid month',
    renewal: activeSubscription ? null : 'First charge is 14 full days after verified activation, if separately authorized and not canceled',
    status: activeSubscription ? null : 'Founding offer reserved',
  };
  if (hasPilotRequest(user) && !activeSubscription) return {
    requested: true, progress: 'Free pilot requested — no automatic billing',
    plan: `${offer.title} requested · up to 40 recovered calls`,
    renewal: 'No automatic paid conversion', status: 'Pilot requested',
  };
  return {requested: false, progress: 'Subscription recorded', plan: null, renewal: null, status: null};
}
