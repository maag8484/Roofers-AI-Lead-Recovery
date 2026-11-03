import {termsVersion} from './founding-card-pilot.mjs';

// Input is a trusted, reconciled billing-period snapshot, not signup metadata.
// Delivery must claim key uniquely before sending; an uncertain send requires
// reconciliation by receipt before retry. This function cannot send or charge.
export function planUsageWarning(period, recoveredCalls, nowMs) {
  const {companyId, startMs, endMs, phase, version, purchasedPacks} = period;
  if (phase !== 'paid' || version !== termsVersion || !companyId ||
      ![startMs,endMs,nowMs].every(Number.isSafeInteger) ||
      nowMs < startMs || nowMs >= endMs || purchasedPacks !== 0) return null;
  const ids = new Set();
  for (const call of recoveredCalls) {
    if (call.companyId === companyId && call.billableRecovered === true &&
        call.id && call.atMs >= startMs && call.atMs <= nowMs) ids.add(call.id);
  }
  const used = ids.size;
  if (used < 65 || used >= 75) return null;
  return {
    key: JSON.stringify(['base-65', companyId, startMs]),
    subject: 'Your Roof AI plan is nearing its 75-call limit',
    text: `You've used ${used} of your 75 recovered calls this billing month. You have ${75-used} left.\n\nYou can add 20 recovered calls for $50, bringing this month's limit to 95, or add 50 recovered calls for $100, bringing it to 125. Each pack is a one-time purchase for this billing month. Reply to request a secure purchase link. If you do nothing, your limit stays at 75. We won't charge you for extra calls unless you buy a block.`,
  };
}
