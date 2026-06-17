import { LegalLayout, LegalSection } from "@/components/marketing/LegalLayout";

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="June 17, 2026">
      <p>
        Roof AI Lead Recovery ("we", "us") respects your privacy. This policy explains what
        information we collect, how we use it, and the choices you have. This is a template and
        should be reviewed by legal counsel before launch.
      </p>

      <LegalSection heading="Information We Collect">
        <p>
          We collect account details (company name, owner name, email, phone), business
          information you provide during setup, payment information processed by Stripe, and
          lead and appointment data generated through the service.
        </p>
      </LegalSection>

      <LegalSection heading="Google Calendar Data">
        <p>
          With your authorization, we access your Google Calendar to check availability and book
          appointments. We request the minimum scopes required and store OAuth tokens encrypted.
          You can revoke access at any time from your Google account or by disconnecting in the
          app. Our use of information received from Google APIs adheres to the Google API Services
          User Data Policy, including the Limited Use requirements.
        </p>
      </LegalSection>

      <LegalSection heading="How We Use Information">
        <p>
          We use your information to provide and operate the service, respond to leads on your
          behalf, book appointments, process billing, and provide support.
        </p>
      </LegalSection>

      <LegalSection heading="Sharing">
        <p>
          We share data with service providers that power the platform — including Supabase
          (database/auth), Stripe (payments), Twilio (telephony), and Google (calendar) — solely
          to deliver the service. We do not sell your data.
        </p>
      </LegalSection>

      <LegalSection heading="Data Retention & Security">
        <p>
          We retain data for as long as your account is active. Sensitive tokens are encrypted at
          rest, and access is restricted by row-level security. No method of transmission is 100%
          secure, but we take reasonable measures to protect your data.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions? Email{" "}
          <a className="text-brand-600 hover:underline" href="mailto:hello@roofaileadrecovery.com">
            hello@roofaileadrecovery.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
