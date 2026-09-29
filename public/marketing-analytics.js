(() => {
  // Public acquisition only. Do not instrument authenticated or recovery pages.
  const id = 'G-8PV83SZ3X0';
  const publicPaths = new Set(['/', '/home-v1', '/signup', '/checkout']);
  const path = location.pathname.replace(/\/$/, '') || '/';
  const params = new URLSearchParams(location.search);
  let qa = params.get('qa') === '1' || params.get('utm_source') === 'qa_internal';
  try {
    if (qa) sessionStorage.setItem('roof_ai_qa', '1');
    qa = qa || sessionStorage.getItem('roof_ai_qa') === '1';
  } catch { /* Storage is optional. */ }
  if (!['www.roofaileadrecovery.com', 'roofaileadrecovery.com'].includes(location.hostname) || qa || !publicPaths.has(path)) return;
  const campaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const safeUrl = new URL(location.origin + path);
  for (const key of campaignKeys) if (params.has(key)) safeUrl.searchParams.set(key, params.get(key).slice(0, 100));
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id, {
    page_location: safeUrl.href,
    page_referrer: document.referrer ? (() => { try { const u = new URL(document.referrer); return u.origin + u.pathname; } catch { return ''; } })() : '',
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    // Route-level views are not claimed here; the SPA click events measure intent.
    send_page_view: true
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);
  // Stop collection before client-side navigation reaches private application paths.
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method];
    history[method] = function (...args) {
      if (args[2] != null) {
        const next = new URL(args[2], location.href).pathname.replace(/\/$/, '') || '/';
        window[`ga-disable-${id}`] = !publicPaths.has(next);
      }
      return original.apply(this, args);
    };
  }
  addEventListener('popstate', () => { window[`ga-disable-${id}`] = !publicPaths.has(location.pathname.replace(/\/$/, '') || '/'); });
  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[href]');
    if (!link || window[`ga-disable-${id}`]) return;
    const target = new URL(link.href, location.href);
    if (target.origin !== location.origin) return;
    const destination = target.pathname.replace(/\/$/, '') || '/';
    const eventName = destination === '/signup' ? 'signup_clicked' : destination === '/how-much-are-missed-calls-costing-your-roofing-company' ? 'calculator_clicked' : null;
    if (eventName) window.gtag('event', eventName, {send_to: id, page_path: location.pathname, link_location: 'main_website'});
  });
})();
