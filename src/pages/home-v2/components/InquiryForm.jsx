import { useRef, useState } from "react";

const CONSENT = "I am interested in Roof AI Lead Recovery and request a phone call from its team, including Jesse, at the number provided about its services. This is a request for a human callback, not automated calls or marketing texts. No purchase is required.";

export function InquiryForm() {
  const pending = useRef(false);
  const [state, setState] = useState("idle");
  const [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault();
    if (pending.current || state === "success") return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    pending.current = true;
    setState("pending");
    setMessage("");
    const fields = Object.fromEntries(new FormData(form));
    const query = new URLSearchParams(window.location.search);
    const attribution = Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_content"].map(key => [key, query.get(key) || ""]));
    attribution.landing_page = window.location.origin + window.location.pathname;
    // Keep contact details and arbitrary URL parameters out of analytics/storage.
    try { attribution.referrer = document.referrer ? new URL(document.referrer).origin : ""; } catch { /* no referrer */ }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/audit-request", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ ...fields, requestType: "human_callback", callbackConsentVersion: "human-callback-v1", contactConsent: fields.contactConsent === "on", aiDemoRequested: false, marketingConsent: false, submissionPage: window.location.origin + window.location.pathname + "#inquiry", attribution }),
      });
      const result = await response.json();
      if (response.status !== 201 || result.ok !== true || !result.requestId) {
        throw new Error(response.status === 429 ? "Please wait before trying again. Your details are still here." : "We couldn't confirm your request. Your details are still here. Please try again or email cory@roofaileadrecovery.com.");
      }
      setState("success");
      setMessage("Your request is saved. Our team will review it and contact you at the number you provided. No purchase or subscription has been started.");
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "callback_inquiry_submit", page_path: window.location.pathname, traffic_source: attribution.utm_source || "direct", traffic_campaign: attribution.utm_campaign || "none" });
    } catch (error) {
      setState("error");
      setMessage(error.name === "AbortError" ? "Confirmation is taking longer than expected. Your request may have been saved. Please email cory@roofaileadrecovery.com before submitting again." : error.message);
    } finally { clearTimeout(timeout); pending.current = false; }
  }
  return <section id="inquiry" aria-labelledby="inquiry-title" className="scroll-mt-24 border-y border-[var(--line)] bg-[var(--deep)] px-5 py-16 sm:px-8">
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
      <div>
        <p className="mb-3 text-sm font-bold uppercase tracking-widest text-[var(--brand-glow)]">For roofing business owners</p>
        <h2 id="inquiry-title" className="hv2-display text-3xl font-bold leading-tight text-[var(--text)] sm:text-4xl">Busy on a roof? Let's talk about the calls you miss.</h2>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-[var(--text-dim)]">Tell us how to reach you. Jesse or another member of our team can walk through your current call handling and help you decide whether Roof AI fits your business.</p>
        <p className="mt-5 font-semibold text-[var(--text)]">No payment. No signup. Just a conversation.</p>
      </div>
      <form onSubmit={submit} className="rounded-3xl border border-[var(--line-2)] bg-[var(--void)] p-6 sm:p-8" aria-label="Request a human callback">
        <h3 className="mb-5 text-xl font-bold text-[var(--text)]">Have us call you</h3>
        <fieldset disabled={state === "pending" || state === "success"} className="space-y-4 disabled:opacity-70">
          {[
            ["fullName", "Name", "text", "name", 100, "Your full name"],
            ["email", "Email", "email", "email", 254, "you@company.com"],
            ["address", "Business address", "text", "street-address", 150, "Street, city, state and ZIP"],
            ["phone", "Phone number", "tel", "tel", 30, "(555) 555-0123"],
          ].map(([name, label, type, autoComplete, maxLength, placeholder]) => <div key={name}>
            <label htmlFor={`inquiry-${name}`} className="mb-1.5 block text-sm font-semibold text-[var(--text)]">{label}</label>
            <input id={`inquiry-${name}`} name={name} type={type} autoComplete={autoComplete} maxLength={maxLength} placeholder={placeholder} required className="w-full rounded-xl border border-slate-400 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>)}
          <div hidden aria-hidden="true"><label>Leave blank<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
          <label className="flex items-start gap-3 text-xs leading-relaxed text-[var(--text-dim)]"><input name="contactConsent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0" />{CONSENT}</label>
          <button type="submit" className="w-full rounded-full bg-blue-600 px-6 py-3.5 text-base font-bold text-white hover:bg-blue-700 disabled:cursor-wait">{state === "pending" ? "Saving your request…" : state === "success" ? "Request received" : "Request my callback"}</button>
        </fieldset>
        <p className="mt-4 text-xs text-[var(--text-dim)]">Your details are used to respond to your inquiry. <a href="/privacy" className="underline">Privacy policy</a></p>
        {message && <p role={state === "error" ? "alert" : "status"} className={`mt-4 rounded-xl p-3 text-sm ${state === "error" ? "bg-red-50 text-red-900" : "bg-emerald-50 text-emerald-900"}`}>{message}</p>}
      </form>
    </div>
  </section>;
}
