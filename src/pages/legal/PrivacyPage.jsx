import { LegalLayout, LegalSection } from "@/components/marketing/LegalLayout";

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="June 23, 2026">
      <p>
        Roof AI Lead Recovery ("we", "us", "our") respects your privacy. This Privacy Policy
        explains what information we collect, how we use it, and your rights regarding your data.
        By using our service, you agree to the practices described in this policy.
      </p>

      <LegalSection heading="Information We Collect">
        <p>We collect the following categories of information:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li><strong>Account information:</strong> company name, owner name, email address, and phone number provided during signup.</li>
          <li><strong>Business information:</strong> service area, business phone, website, and monthly lead volume provided during onboarding.</li>
          <li><strong>Payment information:</strong> processed and stored securely by Stripe. We do not store card numbers on our servers.</li>
          <li><strong>Telephony data:</strong> phone numbers provisioned through Twilio, call logs, and SMS message records.</li>
          <li><strong>Lead and appointment data:</strong> homeowner contact information, inquiry details, and appointment records generated through the service.</li>
          <li><strong>Calendar data:</strong> availability and appointment information from your connected Google Calendar.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="SMS Messaging & Telephone Consumer Protection Act (TCPA)">
        <p>
          Roof AI Lead Recovery sends automated SMS messages to homeowners who have called a
          roofing company's business phone number. By calling the business phone number, homeowners
          provide implied consent to receive a follow-up SMS regarding their inquiry.
        </p>
        <p className="mt-3">
          <strong>Message frequency:</strong> Message frequency varies based on homeowner interactions.
          You may receive up to 5 messages per inquiry.
        </p>
        <p className="mt-3">
          <strong>Message and data rates:</strong> Standard message and data rates may apply depending
          on your mobile carrier and plan.
        </p>
        <p className="mt-3">
          <strong>Opt-out:</strong> Homeowners can opt out of receiving SMS messages at any time by
          replying <strong>STOP</strong> to any message. After opting out, you will receive one
          confirmation message and no further messages will be sent.
        </p>
        <p className="mt-3">
          <strong>Help:</strong> For assistance, reply <strong>HELP</strong> to any message or
          contact us at{" "}
          <a className="text-brand-600 hover:underline" href="mailto:support@roofaileadrecovery.com">
            support@roofaileadrecovery.com
          </a>.
        </p>
        <p className="mt-3">
          We do not share homeowner phone numbers with third parties for marketing purposes.
        </p>
      </LegalSection>

      <LegalSection heading="Google Calendar Data">
        <p>
          With your explicit authorization, we access your Google Calendar solely to check your
          availability and book inspection appointments on your behalf. We request only the minimum
          scopes required for this functionality. OAuth tokens are stored encrypted using AES-256
          encryption. You can revoke access at any time from your Google Account settings or by
          disconnecting in the app dashboard.
        </p>
        <p className="mt-3">
          Our use of information received from Google APIs adheres to the{" "}
          <a
            className="text-brand-600 hover:underline"
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements. We do not use Google user data for advertising
          or to train AI/ML models.
        </p>
      </LegalSection>

      <LegalSection heading="How We Use Your Information">
        <p>We use collected information to:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Provide, operate, and improve the service</li>
          <li>Respond to missed calls and inquiries on your behalf via SMS</li>
          <li>Book appointments on your connected Google Calendar</li>
          <li>Process billing and manage your subscription</li>
          <li>Send service notifications and support communications</li>
          <li>Comply with legal obligations</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Information Sharing">
        <p>
          We share data only with third-party service providers that are necessary to operate the
          platform:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li><strong>Supabase</strong> — database hosting and user authentication</li>
          <li><strong>Stripe</strong> — payment processing and subscription management</li>
          <li><strong>Twilio</strong> — phone number provisioning and SMS delivery</li>
          <li><strong>Google</strong> — calendar integration</li>
        </ul>
        <p className="mt-3">
          We do not sell, rent, or share your personal information or homeowner data with any
          third parties for marketing or advertising purposes.
        </p>
      </LegalSection>

      <LegalSection heading="Data Retention & Security">
        <p>
          We retain your account and business data for as long as your account is active. Lead and
          appointment records are retained for up to 2 years. Sensitive credentials (e.g., Google
          OAuth tokens) are encrypted at rest using AES-256 encryption. All data is protected by
          row-level security policies ensuring each customer can only access their own data.
        </p>
        <p className="mt-3">
          No method of transmission over the internet is 100% secure. We take commercially
          reasonable measures to protect your data but cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection heading="Your Rights">
        <p>You have the right to:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and associated data</li>
          <li>Disconnect your Google Calendar at any time</li>
          <li>Opt out of SMS communications by replying STOP</li>
        </ul>
        <p className="mt-3">
          To exercise any of these rights, contact us at{" "}
          <a className="text-brand-600 hover:underline" href="mailto:support@roofaileadrecovery.com">
            support@roofaileadrecovery.com
          </a>.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify you of significant
          changes by email or by posting a notice in the dashboard. Continued use of the service
          after changes constitutes acceptance of the updated policy.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          If you have questions about this Privacy Policy, please contact us at{" "}
          <a className="text-brand-600 hover:underline" href="mailto:support@roofaileadrecovery.com">
            support@roofaileadrecovery.com
          </a>{" "}
          or write to us at: Roof AI Lead Recovery, roofaileadrecovery.com.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
