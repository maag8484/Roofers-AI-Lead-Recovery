import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateAuditRequest, HUMAN_CALLBACK_CONSENT_TEXT } from "../api/audit-request.js";
const valid = { requestType: "human_callback", fullName: "Test Visitor", email: "test@example.com", address: "100 Example St, Columbus, OH 43215", phone: "614-555-0123", contactConsent: true, callbackConsentVersion: "human-callback-v1" };
test("callback stores address and exact consent without authorizing AI or marketing", () => {
 const {payload, errors} = validateAuditRequest({...valid, aiDemoRequested:true, marketingConsent:true});
 assert.deepEqual(errors, []);
 assert.equal(payload.service_area, valid.address);
 assert.equal(payload.phone, "+16145550123");
 assert.equal(payload.preferred_contact, "phone");
 assert.equal(payload.consent_version, "human-callback-v1");
 assert.equal(payload.current_process, HUMAN_CALLBACK_CONSENT_TEXT);
 assert.equal(payload.ai_demo_requested, false);
 assert.equal(payload.ai_demo_consent, null);
 assert.equal(payload.marketing_consent, false);
});
test("callback rejects missing address, invalid phone, missing or mismatched permission", () => {
 for (const [patch, field] of [[{address:""},"address"],[{phone:"abc"},"phone"],[{contactConsent:false},"contactConsent"],[{callbackConsentVersion:"other"},"callbackConsentVersion"]]) {
  assert.ok(validateAuditRequest({...valid,...patch}).errors.includes(field));
 }
});
test("visible callback disclosure matches the server's retained evidence", () => {
 const source = readFileSync(new URL("../src/pages/home-v2/components/InquiryForm.jsx", import.meta.url), "utf8");
 assert.ok(source.includes(JSON.stringify(HUMAN_CALLBACK_CONSENT_TEXT)));
});
