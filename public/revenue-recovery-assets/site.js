(() => {
  const auditUrl = "mailto:cory@roofaileadrecovery.com?subject=Free%20Missed%20Revenue%20Audit";
  const homeUrl = "/roofing-revenue-recovery/";
  const attributionKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];
  const query = new URLSearchParams(window.location.search);
  const pushEvent = (event, details = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...details });
  };
  const readStoredAttribution = () => {
    try { return JSON.parse(localStorage.getItem("roof_ai_first_touch") || "null"); }
    catch { return null; }
  };
  const currentAttribution = Object.fromEntries(attributionKeys.map((key) => [key, query.get(key) || ""]).filter(([, value]) => value));
  const firstTouch = readStoredAttribution() || {
    ...currentAttribution,
    landing_page: window.location.pathname,
    referrer: document.referrer || "direct",
    captured_at: new Date().toISOString(),
  };
  try {
    if (!readStoredAttribution()) localStorage.setItem("roof_ai_first_touch", JSON.stringify(firstTouch));
  } catch { /* Attribution still works for this page when storage is unavailable. */ }

  pushEvent("hub_page_view", {
    page_path: window.location.pathname,
    page_type: window.location.pathname.includes("/resources/") ? "resource" : "cornerstone",
    traffic_source: currentAttribution.utm_source || firstTouch.utm_source || "direct",
    traffic_medium: currentAttribution.utm_medium || firstTouch.utm_medium || "none",
    traffic_campaign: currentAttribution.utm_campaign || firstTouch.utm_campaign || "none",
  });
  const header = `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header">
      <nav class="nav-shell" aria-label="Primary navigation">
        <a class="brand" href="${homeUrl}" aria-label="Roof AI Revenue Recovery Hub home">
          <img class="brand-logo" src="/revenue-recovery-assets/roof-ai-logo.webp" width="148" height="61" decoding="async" alt="Roof AI Lead Recovery">
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
            <img class="brand-logo" src="/revenue-recovery-assets/roof-ai-logo.webp" width="148" height="61" loading="lazy" decoding="async" alt="Roof AI Lead Recovery">
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
  document.body.insertAdjacentHTML("beforeend", `
    <dialog class="audit-dialog" data-audit-dialog aria-labelledby="audit-title">
      <div class="audit-modal">
        <button class="audit-close" type="button" data-audit-close aria-label="Close audit form">&times;</button>
        <p class="kicker">Free · No obligation</p>
        <h2 id="audit-title">Get Your Missed Revenue Audit</h2>
        <p class="audit-intro">Share a few details and we’ll review where unanswered roofing calls may be losing their next step.</p>
        <form data-audit-form>
          <div class="audit-trap" aria-hidden="true"><label for="audit-website">Website</label><input id="audit-website" name="website" tabindex="-1" autocomplete="off"></div>
          <div class="audit-fields">
            <div class="field"><label for="audit-name">Full name</label><input id="audit-name" name="fullName" autocomplete="name" maxlength="100" required></div>
            <div class="field"><label for="audit-email">Work email</label><input id="audit-email" name="email" type="email" autocomplete="email" maxlength="254" required></div>
            <div class="field"><label for="audit-company">Roofing company</label><input id="audit-company" name="company" autocomplete="organization" maxlength="150" required></div>
            <div class="field"><label for="audit-area">Primary service area</label><input id="audit-area" name="serviceArea" placeholder="City, state or region" maxlength="150" required></div>
            <div class="field"><label for="audit-phone">Phone <span>(optional)</span></label><input id="audit-phone" name="phone" type="tel" autocomplete="tel" maxlength="30"></div>
            <div class="field"><label for="audit-contact">Preferred follow-up</label><select id="audit-contact" name="preferredContact"><option value="Email">Email</option><option value="Phone">Phone call</option></select></div>
            <div class="field audit-wide"><label for="audit-process">What happens to missed calls today? <span>(optional)</span></label><textarea id="audit-process" name="currentProcess" rows="3" maxlength="500" placeholder="Voicemail, manual callback, answering service…"></textarea></div>
          </div>
          <div class="audit-calculator-summary" data-audit-calculator-summary hidden></div>
          <label class="audit-check"><input name="contactConsent" type="checkbox" required> <span>By submitting, I agree that Roof AI Lead Recovery may contact me about my requested audit and acknowledge the <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>.</span></label>
          <label class="audit-check"><input name="marketingConsent" type="checkbox"> <span>Send me occasional roofing revenue-recovery tips and product updates. Optional.</span></label>
          <p class="audit-phone-note" data-phone-note hidden>By choosing phone follow-up, you agree to receive a call about this audit. Consent is not a condition of purchase.</p>
          <button class="button audit-submit" type="submit">Request My Free Audit</button>
          <p class="audit-status" data-audit-status role="status" aria-live="polite"></p>
          <p class="disclaimer">Your request will be sent securely. If it cannot be submitted, we’ll prepare an email as a fallback.</p>
        </form>
      </div>
    </dialog>`);
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector("#nav-links");
  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
    links?.classList.toggle("open", !open);
  });

  let calculatorModel = null;
  const calculator = document.querySelector("[data-calculator]");
  if (calculator) {
    const missed = calculator.querySelector("#missed-calls");
    const legitimate = calculator.querySelector("#legitimate-rate");
    const closeRate = calculator.querySelector("#close-rate");
    const jobValue = calculator.querySelector("#job-value");
    const revenue = calculator.querySelector("#revenue-risk");
    const opportunities = calculator.querySelector("#qualified-opportunities");
    const jobs = calculator.querySelector("#projected-jobs");
    const annual = calculator.querySelector("#annual-risk");
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
      calculatorModel = { missedCalls: m, legitimateRate: l * 100, closeRate: c * 100, jobValue: v, monthlyRisk: r, annualRisk: r * 12 };
      revenue.textContent = currency.format(r);
      opportunities.textContent = decimal.format(q);
      jobs.textContent = decimal.format(j);
      annual.textContent = currency.format(r * 12);
    };

    let calculatorStarted = false;
    calculator.addEventListener("input", () => {
      if (!calculatorStarted) {
        calculatorStarted = true;
        pushEvent("calculator_started", { page_path: window.location.pathname });
      }
      calculate();
    });
    calculator.addEventListener("submit", (event) => event.preventDefault());
    calculate();
  }

  const dialog = document.querySelector("[data-audit-dialog]");
  const auditForm = dialog?.querySelector("[data-audit-form]");
  const contactChoice = auditForm?.querySelector("[name=preferredContact]");
  const phoneInput = auditForm?.querySelector("[name=phone]");
  let auditCtaLocation = "unknown";
  const riskBand = (value) => value >= 100000 ? "100k_plus" : value >= 50000 ? "50k_100k" : value >= 10000 ? "10k_50k" : "under_10k";

  const openAudit = (link) => {
    auditCtaLocation = link.closest(".site-header") ? "header" : link.closest(".site-footer") ? "footer" : link.closest(".cta-band") ? "cta_band" : link.closest(".sidebar") ? "sidebar" : "content";
    const summary = dialog.querySelector("[data-audit-calculator-summary]");
    if (calculatorModel?.monthlyRisk > 0) {
      summary.hidden = false;
      summary.textContent = `Calculator scenario included: ${Math.round(calculatorModel.missedCalls)} missed calls per month and approximately ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(calculatorModel.monthlyRisk)} in modeled monthly gross revenue at risk.`;
    } else {
      summary.hidden = true;
    }
    pushEvent("audit_cta_clicked", { page_path: window.location.pathname, cta_location: auditCtaLocation });
    const submitButton = auditForm?.querySelector(".audit-submit");
    if (submitButton) {
      submitButton.hidden = false;
      submitButton.disabled = false;
      submitButton.textContent = "Request My Free Audit";
    }
    const status = auditForm?.querySelector("[data-audit-status]");
    if (status) { status.textContent = ""; status.className = "audit-status"; }
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    dialog.querySelector("input")?.focus();
  };

  document.querySelectorAll('a[href^="mailto:cory@roofaileadrecovery.com"]').forEach((link) => {
    if (!decodeURIComponent(link.href).toLowerCase().includes("missed revenue audit")) return;
    link.addEventListener("click", (event) => { event.preventDefault(); openAudit(link); });
  });
  dialog?.querySelector("[data-audit-close]")?.addEventListener("click", () => dialog.close());
  dialog?.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  contactChoice?.addEventListener("change", () => {
    const phoneSelected = contactChoice.value === "Phone";
    dialog.querySelector("[data-phone-note]").hidden = !phoneSelected;
    phoneInput.required = phoneSelected;
  });

  let auditFormStarted = false;
  auditForm?.addEventListener("input", () => {
    if (!auditFormStarted) {
      auditFormStarted = true;
      pushEvent("audit_form_started", { page_path: window.location.pathname, cta_location: auditCtaLocation });
    }
  });
  auditForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!auditForm.reportValidity()) {
      pushEvent("audit_form_error", { page_path: window.location.pathname, error_type: "validation" });
      return;
    }
    const values = Object.fromEntries(new FormData(auditForm).entries());
    const attribution = { ...firstTouch, ...currentAttribution };
    const lines = [
      "Free Missed Revenue Audit Request", "",
      `Name: ${values.fullName}`, `Work email: ${values.email}`, `Roofing company: ${values.company}`,
      `Service area: ${values.serviceArea}`, `Phone: ${values.phone || "Not provided"}`,
      `Preferred follow-up: ${values.preferredContact}`, `Current missed-call process: ${values.currentProcess || "Not provided"}`,
    ];
    if (calculatorModel?.monthlyRisk > 0) lines.push(
      "", "Calculator scenario:", `Missed calls/month: ${calculatorModel.missedCalls}`,
      `Legitimate opportunities: ${calculatorModel.legitimateRate}%`, `Lead-to-job close rate: ${calculatorModel.closeRate}%`,
      `Average job value: $${calculatorModel.jobValue}`, `Modeled monthly gross revenue at risk: $${Math.round(calculatorModel.monthlyRisk)}`,
    );
    lines.push("", "Attribution:", `Submission page: ${window.location.href}`, `Landing page: ${attribution.landing_page || "Unknown"}`,
      `Referrer: ${attribution.referrer || "direct"}`, ...attributionKeys.map((key) => `${key}: ${attribution[key] || ""}`),
      "", "Audit contact consent: Yes", "Consent version: audit-form-v2", `Consent timestamp: ${new Date().toISOString()}`,
      `Marketing updates: ${values.marketingConsent ? "Yes" : "No"}`);
    const analytics = {
      page_path: window.location.pathname,
      cta_location: auditCtaLocation,
      preferred_contact: values.preferredContact.toLowerCase().replace(" ", "_"),
      calculator_included: Boolean(calculatorModel?.monthlyRisk > 0),
      revenue_risk_band: calculatorModel ? riskBand(calculatorModel.monthlyRisk) : "not_calculated",
      traffic_source: attribution.utm_source || "direct",
      traffic_medium: attribution.utm_medium || "none",
      traffic_campaign: attribution.utm_campaign || "none",
    };
    const submitButton = auditForm.querySelector(".audit-submit");
    const status = auditForm.querySelector("[data-audit-status]");
    submitButton.disabled = true;
    submitButton.textContent = "Sending request…";
    status.textContent = "";

    try {
      const response = await fetch("/api/audit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: values.fullName,
          email: values.email,
          company: values.company,
          serviceArea: values.serviceArea,
          phone: values.phone || "",
          preferredContact: values.preferredContact,
          currentProcess: values.currentProcess || "",
          contactConsent: values.contactConsent === "on",
          marketingConsent: values.marketingConsent === "on",
          website: values.website || "",
          submissionPage: window.location.href,
          attribution,
          calculator: calculatorModel || null,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429) {
          status.textContent = "We’ve received several requests from this connection. Please wait an hour or email us directly.";
          status.className = "audit-status error";
          pushEvent("audit_form_error", { page_path: window.location.pathname, error_type: "rate_limited" });
          return;
        }
        throw new Error(result.error || "SUBMISSION_FAILED");
      }
      pushEvent("audit_form_submitted", analytics);
      auditForm.reset();
      dialog.querySelector("[data-audit-calculator-summary]").hidden = true;
      status.textContent = "Thank you—your audit request was received. We’ll follow up using your preferred contact method.";
      status.className = "audit-status success";
      submitButton.hidden = true;
    } catch (_error) {
      pushEvent("audit_form_error", { page_path: window.location.pathname, error_type: "service_unavailable" });
      status.textContent = "Secure submission is temporarily unavailable. Opening your email app with the request prepared…";
      status.className = "audit-status error";
      window.location.href = `${auditUrl}&body=${encodeURIComponent(lines.join("\n"))}`;
    } finally {
      if (!submitButton.hidden) {
        submitButton.disabled = false;
        submitButton.textContent = "Request My Free Audit";
      }
    }
  });

  document.querySelectorAll('a[href*="/signup"]').forEach((link) => link.addEventListener("click", () => {
    pushEvent("signup_clicked", { page_path: window.location.pathname, link_location: link.closest(".site-footer") ? "footer" : "content" });
  }));
})();
