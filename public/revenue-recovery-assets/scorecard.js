(() => {
  const form = document.querySelector('[data-call-review]');
  if (!form) return;
  const result = document.querySelector('[data-call-review-result]');
  const share = document.querySelector('[data-share-scorecard]');
  const status = document.querySelector('[data-share-status]');
  let counted = false;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const { missed, eligible, nextStep } = form.elements;
    for (const field of [missed, eligible, nextStep]) field.setCustomValidity('');
    if (!form.reportValidity()) return;
    const values = [missed, eligible, nextStep].map(field => Number(field.value));
    if (values.some(n => !Number.isSafeInteger(n) || n < 0 || n > 100000)) return;
    const [calls, opportunities, handled] = values;
    if (opportunities > calls) { eligible.setCustomValidity('Eligible opportunities cannot exceed unique missed callers.'); eligible.reportValidity(); return; }
    if (handled > opportunities) { nextStep.setCustomValidity('Documented next steps cannot exceed eligible opportunities.'); nextStep.reportValidity(); return; }
    const unresolved = opportunities - handled;
    result.replaceChildren();
    const heading = document.createElement('h3');
    heading.textContent = unresolved ? `${unresolved} eligible ${unresolved === 1 ? 'opportunity needs' : 'opportunities need'} a documented next step` : 'No undocumented next steps in these counts';
    const summary = document.createElement('p');
    summary.textContent = opportunities ? `${handled} of ${opportunities} eligible opportunities have a documented next step (${Math.round(handled / opportunities * 100)}%). This measures follow-through, not booked jobs or recovered revenue.` : 'You entered zero eligible new roofing opportunities. Verify your classification before changing your call handling.';
    const action = document.createElement('p');
    action.textContent = unresolved ? 'Review these callers in your own system, assign an owner, and record the next action. Check whether the gap occurs during office hours, after hours, or both.' : 'Check that the records support each next step, then review whether the follow-up happened. Recheck the same counts next week.';
    result.append(heading, summary, action);
    result.hidden = false;
    // Any edit invalidates the displayed review; do not show stale findings.
    if (!counted) {
      counted = true;
      let qa = new URLSearchParams(location.search).get('qa') === '1' || new URLSearchParams(location.search).get('utm_source') === 'qa_internal';
      try { qa ||= sessionStorage.getItem('roof_ai_qa') === '1'; } catch { /* optional */ }
      if (!qa && ['www.roofaileadrecovery.com', 'roofaileadrecovery.com'].includes(location.hostname) && typeof window.gtag === 'function') {
        try { window.gtag('event', 'scorecard_review_complete', {send_to:'G-8PV83SZ3X0', page_path:location.pathname}); } catch { /* optional */ }
      }
    }
  });
  form.addEventListener('input', () => { result.hidden = true; for (const field of form.querySelectorAll('input')) field.setCustomValidity(''); });
  share?.addEventListener('click', async () => {
    const url = 'https://www.roofaileadrecovery.com/resources/roofing-missed-call-scorecard/?utm_source=shared_resource&utm_medium=referral&utm_campaign=free_call_review#call-review';
    try { await navigator.clipboard.writeText(url); status.textContent = 'Tool link copied. Your entered counts are not included.'; }
    catch { status.textContent = `Copy this public tool link: ${url}`; }
  });
})();
