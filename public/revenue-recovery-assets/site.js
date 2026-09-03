(() => {
  const auditUrl = "mailto:cory@roofaileadrecovery.com?subject=Free%20Missed%20Revenue%20Audit";
  const homeUrl = "/roofing-revenue-recovery/";
  const header = `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header">
      <nav class="nav-shell" aria-label="Primary navigation">
        <a class="brand" href="${homeUrl}" aria-label="Roof AI Revenue Recovery Hub home">
          <img class="brand-logo" src="/media/roof_ai_lead_recovery_logo_transparent.png" width="148" height="60" alt="Roof AI Lead Recovery">
          <span class="hub-label">Revenue Recovery Hub</span>
        </a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Open menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
        <div class="nav-links" id="nav-links">
          <a href="/how-much-are-missed-calls-costing-your-roofing-company/">Revenue calculator</a>
          <a href="/ai-receptionist-for-roofing-companies/">2026 guide</a>
          <a href="/resources/">Resources</a>
          <a class="button small" href="${auditUrl}">Get free audit</a>
        </div>
      </nav>
    </header>`;
  const footer = `
    <footer class="site-footer">
      <div class="footer-grid">
        <div>
          <a class="brand footer-brand" href="/roofing-revenue-recovery/">
            <img class="brand-logo" src="/media/roof_ai_lead_recovery_logo_transparent.png" width="148" height="60" alt="Roof AI Lead Recovery">
            <span class="hub-label">Revenue Recovery Hub</span>
          </a>
          <p>Practical tools for roofing companies that want more of their existing inbound opportunities to receive a real next step.</p>
        </div>
        <div>
          <h3>Cornerstone guides</h3>
          <ul class="footer-links">
            <li><a href="/how-much-are-missed-calls-costing-your-roofing-company/">Missed revenue calculator</a></li>
            <li><a href="/ai-receptionist-for-roofing-companies/">AI receptionist guide</a></li>
            <li><a href="/roofing-answering-service-vs-ai-lead-recovery/">Service comparison</a></li>
            <li><a href="/after-hours-answering-for-roofing-companies/">After-hours answering</a></li>
          </ul>
        </div>
        <div>
          <h3>Roof AI</h3>
          <ul class="footer-links">
            <li><a href="https://www.roofaileadrecovery.com/">Main website</a></li>
            <li><a href="https://www.roofaileadrecovery.com/signup">Start 7-day free trial</a></li>
            <li><a href="${auditUrl}">Free missed revenue audit</a></li>
            <li><a href="mailto:cory@roofaileadrecovery.com">cory@roofaileadrecovery.com</a></li>
            <li><a href="https://www.roofaileadrecovery.com/privacy">Privacy</a> · <a href="https://www.roofaileadrecovery.com/terms">Terms</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">© <span data-year></span> Roof AI Lead Recovery. Estimates shown by the calculator are planning scenarios, not guaranteed results.</div>
    </footer>`;

  document.querySelector("[data-site-header]")?.insertAdjacentHTML("afterbegin", header);
  document.querySelector("[data-site-footer]")?.insertAdjacentHTML("afterbegin", footer);
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector("#nav-links");
  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
    links?.classList.toggle("open", !open);
  });

  const form = document.querySelector("[data-calculator]");
  if (form) {
    const missed = form.querySelector("#missed-calls");
    const legitimate = form.querySelector("#legitimate-rate");
    const closeRate = form.querySelector("#close-rate");
    const jobValue = form.querySelector("#job-value");
    const revenue = form.querySelector("#revenue-risk");
    const opportunities = form.querySelector("#qualified-opportunities");
    const jobs = form.querySelector("#projected-jobs");
    const annual = form.querySelector("#annual-risk");
    const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
    const decimal = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

    const calculate = () => {
      const m = Math.max(0, Number(missed.value) || 0);
      const l = Math.min(100, Math.max(0, Number(legitimate.value) || 0)) / 100;
      const c = Math.min(100, Math.max(0, Number(closeRate.value) || 0)) / 100;
      const v = Math.max(0, Number(jobValue.value) || 0);
      const q = m * l;
      const j = q * c;
      const r = j * v;
      revenue.textContent = currency.format(r);
      opportunities.textContent = decimal.format(q);
      jobs.textContent = decimal.format(j);
      annual.textContent = currency.format(r * 12);
    };

    form.addEventListener("input", calculate);
    form.addEventListener("submit", (event) => event.preventDefault());
    calculate();
  }
})();

