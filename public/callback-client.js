(() => {
  // Shared by the homepage and the focused roofing guide. No contact details
  // enter analytics or browser storage; success means a confirmed saved row.
  if (window.roofCallback) return;
  const id = "G-8PV83SZ3X0";
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];
  const query = new URLSearchParams(location.search);
  const clean = value => typeof value === "string" ? value.slice(0, 150) : "";
  const safePage = value => {
    try { const u = new URL(value, location.origin); return u.origin === location.origin ? u.pathname : location.pathname; }
    catch { return location.pathname; }
  };
  const safeReferrer = value => { try { return new URL(value).origin; } catch { return ""; } };
  const current = Object.fromEntries(keys.filter(key => query.has(key)).map(key => [key, clean(query.get(key))]));
  let saved;
  try { saved = JSON.parse(sessionStorage.getItem("roof_ai_session_touch") || "null"); } catch { /* optional */ }
  const source = Object.keys(current).length ? current : saved || {};
  const attribution = Object.fromEntries(keys.filter(key => source[key]).map(key => [key, clean(source[key])]));
  attribution.landing_page = Object.keys(current).length ? location.pathname : safePage(saved?.landing_page || location.pathname);
  attribution.referrer = safeReferrer(Object.keys(current).length ? document.referrer : saved?.referrer || document.referrer);
  try { sessionStorage.setItem("roof_ai_session_touch", JSON.stringify(attribution)); } catch { /* optional */ }
  let qa = query.get("qa") === "1" || query.get("utm_source") === "qa_internal";
  try { if (qa) sessionStorage.setItem("roof_ai_qa", "1"); qa = qa || sessionStorage.getItem("roof_ai_qa") === "1"; } catch { /* optional */ }
  const publicPage = () => location.pathname === "/" || location.pathname.replace(/\/$/, "") === "/resources/roofing-missed-call-text-back";
  const track = (event, details = {}) => {
    if (qa || !publicPage() || !["www.roofaileadrecovery.com", "roofaileadrecovery.com"].includes(location.hostname) || window[`ga-disable-${id}`]) return;
    if (typeof window.gtag === "function") window.gtag("event", event, {
      send_to: id, page_path: location.pathname,
      traffic_source: attribution.utm_source || "direct",
      traffic_medium: attribution.utm_medium || "none",
      traffic_campaign: attribution.utm_campaign || "none", ...details,
    });
  };
  const submit = async fields => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/audit-request", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({
          fullName: fields.fullName, email: fields.email, phone: fields.phone, website: fields.website || "",
          requestType: "human_callback", callbackConsentVersion: "human-callback-v1",
          contactConsent: fields.contactConsent === "on", aiDemoRequested: false, marketingConsent: false,
          submissionPage: location.origin + location.pathname + "#inquiry", attribution,
        }),
      });
      const result = await response.json();
      if (response.status !== 201 || result.ok !== true || !result.requestId) {
        const error = new Error(response.status === 429 ? "Please wait before trying again. Your details are still here." : "We couldn't confirm your request. Your details are still here. Please try again or email cory@roofaileadrecovery.com.");
        error.code = response.status === 429 ? "rate_limited" : "not_confirmed";
        throw error;
      }
      // Analytics must never turn a saved inquiry into an apparent form failure.
      try { track("callback_inquiry_submit"); } catch { /* collection is optional */ }
      return result;
    } catch (error) {
      try { track("callback_form_error", { error_type: error.name === "AbortError" ? "timeout" : error.code || "network" }); } catch { /* optional */ }
      throw error;
    } finally { clearTimeout(timeout); }
  };
  window.roofCallback = { submit };
  const started = new WeakSet();
  document.addEventListener("focusin", event => {
    const form = event.target.closest?.("[data-callback-form]");
    if (form && !started.has(form)) { started.add(form); track("callback_form_started"); }
  });
  document.addEventListener("click", event => {
    const link = event.target.closest?.("a[href]");
    if (link && new URL(link.href, location.href).origin === location.origin && new URL(link.href, location.href).hash === "#inquiry") track("callback_cta_clicked");
  });
  for (const form of document.querySelectorAll("[data-callback-static]")) {
    let pending = false;
    let complete = false;
    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (pending || complete || !form.reportValidity()) return;
      const fields = Object.fromEntries(new FormData(form));
      const fieldset = form.querySelector("fieldset");
      const button = form.querySelector('button[type="submit"]');
      const message = form.querySelector("[data-callback-status]");
      pending = true; fieldset.disabled = true; button.textContent = "Saving your request…";
      message.textContent = "";
      try {
        await submit(fields);
        complete = true;
        message.setAttribute("role", "status");
        message.textContent = "Your request is saved. Our team will review it and contact you at the number provided. No purchase or subscription has been started.";
      } catch (error) {
        message.setAttribute("role", "alert");
        message.textContent = error.name === "AbortError" ? "Confirmation is taking longer than expected. Your request may have been saved. Please email cory@roofaileadrecovery.com before submitting again." : error.message;
      } finally {
        pending = false; fieldset.disabled = complete;
        button.textContent = complete ? "Request received" : "Request my callback";
      }
    });
  }
})();
