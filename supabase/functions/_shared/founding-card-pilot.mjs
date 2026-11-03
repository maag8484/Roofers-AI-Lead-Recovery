// Build the Stripe trial parameters from verified server records only.
// Called at activation (never signup); caller owns locking/idempotency.
export const termsVersion = 'pilot-14d-40calls-199-card-v4';
export function foundingTrialEnd(record, nowMs) {
  const { version, consentAt, cardSetupVerified, setupComplete, liveTestAt,
    founderReserved, paidAllowanceQuoted, cancelled } = record;
  const consent = Date.parse(consentAt), activation = Date.parse(liveTestAt);
  if (version !== termsVersion || cancelled !== false || cardSetupVerified !== true ||
      setupComplete !== true || founderReserved !== true || paidAllowanceQuoted !== true ||
      ![nowMs, consent, activation].every(Number.isFinite) || consent > activation ||
      activation > nowMs) throw new Error('Pilot is not eligible for automatic billing');
  const end = Math.floor(activation / 1000) + 14 * 86400;
  if (end <= Math.floor(nowMs / 1000)) throw new Error('Past trial end requires manual review');
  return end;
}

// Quote only. Never interpret a usage count or a card on file as permission
// to buy a pack. Scope this quote to one customer's paid billing period.
export function foundingMonthQuote(packs20 = 0, packs50 = 0) {
  if (![packs20, packs50].every(n => Number.isSafeInteger(n) && n >= 0))
    throw new RangeError('Expected non-negative whole pack quantities');
  const addOnCents = 5000 * packs20 + 10000 * packs50;
  const subtotalCents = 19900 + addOnCents;
  if (!Number.isSafeInteger(subtotalCents)) throw new RangeError('Quote exceeds supported range');
  return {currency: 'usd', baseCents: 19900, addOnCents, subtotalCents,
    callLimit: 75 + 20 * packs20 + 50 * packs50};
}
