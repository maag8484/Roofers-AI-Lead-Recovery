import { LegalLayout, LegalSection } from "@/components/marketing/LegalLayout";

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="September 4, 2026">
      <p>
        Welcome to Roof AI Lead Recovery ("Roof AI," "we," "our," or "us"). We value your privacy and
        are committed to protecting your personal and business information. This Privacy Policy explains
        what information we collect, how we use it, and your choices regarding your information.
      </p>

      <LegalSection heading="Information We Collect">
        <p>When you use our website or services, we may collect:</p>
        <p className="mt-3 font-semibold text-ink">Business Information</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Company name</li>
          <li>Contact name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Business address</li>
          <li>Website URL</li>
        </ul>
        <p className="mt-3 font-semibold text-ink">Customer Information</p>
        <p className="mt-1">
          As part of providing our services, we may process information relating to your customers, including:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Name</li>
          <li>Phone number</li>
          <li>Email address</li>
          <li>Appointment details</li>
          <li>Messages exchanged through our platform</li>
        </ul>
        <p className="mt-3">We process this information solely to provide our services to your business.</p>
      </LegalSection>

      <LegalSection heading="How We Use Your Information">
        <p>We use information to:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Provide our AI lead recovery service</li>
          <li>Respond to missed calls</li>
          <li>Send SMS follow-ups</li>
          <li>Schedule appointments</li>
          <li>Improve our platform</li>
          <li>Process subscription payments</li>
          <li>Provide customer support</li>
          <li>Prevent fraud and abuse</li>
          <li>Comply with legal obligations</li>
        </ul>
      </LegalSection>

      <LegalSection heading="SMS Communications">
        <p>Our platform sends automated text messages on behalf of your business.</p>
        <p className="mt-3">
          By using Roof AI Lead Recovery, you represent that you have obtained all necessary customer
          consent required under applicable laws before sending communications through our platform.
        </p>
        <p className="mt-3">Standard message and data rates may apply.</p>
        <p className="mt-3">Recipients may opt out by replying <strong>STOP</strong>.</p>
      </LegalSection>

      <LegalSection heading="Third-Party Services">
        <p>To provide our services, we work with trusted third-party providers, including but not limited to:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Smith.ai</li>
          <li>Stripe</li>
          <li>Google Calendar</li>
          <li>Twilio or other messaging providers</li>
          <li>Email service providers</li>
          <li>Cloud hosting providers</li>
        </ul>
        <p className="mt-3">These providers process information only as necessary to perform their services.</p>
      </LegalSection>

      <LegalSection heading="Payment Information">
        <p>Payments are securely processed through Stripe.</p>
        <p className="mt-3">Roof AI Lead Recovery does not store your complete credit card information.</p>
      </LegalSection>

      <LegalSection heading="Data Security">
        <p>
          We implement commercially reasonable security measures designed to protect your information.
        </p>
        <p className="mt-3">
          However, no internet transmission or electronic storage system is 100% secure, and we cannot
          guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection heading="Data Retention">
        <p>
          We retain information only as long as necessary to provide our services, comply with legal
          obligations, resolve disputes, and enforce our agreements.
        </p>
        <p className="mt-3">
          Missed Revenue Audit requests are retained for up to 18 months. Requests identified as spam are
          deleted after 30 days, and one-way identifiers used only for submission rate limiting are removed
          after 24 hours. You may request earlier deletion using the contact information below, subject to
          legal obligations that require us to keep particular records.
        </p>
      </LegalSection>

      <LegalSection heading="Your Rights">
        <p>Depending on your location, you may have rights to:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Access your information</li>
          <li>Correct inaccurate information</li>
          <li>Delete your information</li>
          <li>Request data portability</li>
          <li>Object to certain processing activities</li>
        </ul>
        <p className="mt-3">
          To make a request, contact us at{" "}
          <a className="text-brand-600 hover:underline" href="mailto:support@roofaileadrecovery.com">
            support@roofaileadrecovery.com
          </a>.
        </p>
      </LegalSection>

      <LegalSection heading="Cookies">
        <p>We may use cookies and similar technologies to:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Improve website performance</li>
          <li>Remember preferences</li>
          <li>Analyze website traffic</li>
          <li>Enhance user experience</li>
        </ul>
        <p className="mt-3">You may disable cookies through your browser settings.</p>
      </LegalSection>

      <LegalSection heading="Children's Privacy">
        <p>
          Our services are intended for businesses and are not directed to individuals under the age of 13.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to This Policy">
        <p>We may update this Privacy Policy from time to time.</p>
        <p className="mt-3">
          The latest version will always be posted on this page with an updated effective date.
        </p>
      </LegalSection>

      <LegalSection heading="Contact Us">
        <p>Questions? Contact us at:</p>
        <p className="mt-2 font-semibold text-ink">Roof AI Lead Recovery</p>
        <p>
          <a className="text-brand-600 hover:underline" href="mailto:support@roofaileadrecovery.com">
            support@roofaileadrecovery.com
          </a>
        </p>
        <p>
          <a className="text-brand-600 hover:underline" href="https://www.roofaileadrecovery.com">
            www.roofaileadrecovery.com
          </a>
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
