(() => {
  document.querySelector('[data-print-scorecard]')?.addEventListener('click', () => window.print());
  const form = document.querySelector('[data-partner-link-form]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const partner = form.elements.partner.value.trim();
    if (!/^[a-z0-9][a-z0-9_-]{0,49}$/.test(partner)) return;
    const url = new URL('https://www.roofaileadrecovery.com/how-much-are-missed-calls-costing-your-roofing-company/');
    url.search = new URLSearchParams({ utm_source: partner, utm_medium: 'partner_referral', utm_campaign: 'agency_resource_kit', utm_content: 'scorecard_20260915' });
    const link = document.createElement('a');
    link.href = url.href;
    link.textContent = url.href;
    document.querySelector('[data-partner-link-result]').replaceChildren(link);
  });
})();
