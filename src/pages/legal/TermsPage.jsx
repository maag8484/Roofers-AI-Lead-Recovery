import { LegalLayout, LegalSection } from "@/components/marketing/LegalLayout";

export default function TermsPage() {
  return (
    <LegalLayout title="Terms & Conditions" updated="July 28, 2026">
      <p>
        These Terms and Conditions govern your use of Roof AI Lead Recovery. By creating an account
        or using our services, you agree to these Terms.
      </p>

      <LegalSection heading="Services">
        <p>
          Roof AI Lead Recovery provides software that helps roofing companies recover missed leads
          through AI-powered messaging, appointment scheduling, and related communication services.
        </p>
        <p className="mt-3">We may update or improve the platform at any time.</p>
      </LegalSection>

      <LegalSection heading="Eligibility">
        <p>You must be at least 18 years old and authorized to act on behalf of your business.</p>
      </LegalSection>

      <LegalSection heading="Account Responsibilities">
        <p>You agree to:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Provide accurate information</li>
          <li>Keep your login credentials secure</li>
          <li>Notify us of unauthorized access</li>
          <li>Maintain accurate business information</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Subscription">
        <p>Your subscription is billed monthly.</p>
        <p className="mt-3">
          Unless canceled before renewal, your subscription automatically renews each billing cycle.
        </p>
      </LegalSection>

      <LegalSection heading="Free Trial">
        <p>New customers may receive a free trial.</p>
        <p className="mt-3">
          At the end of the trial period, your subscription automatically converts to a paid plan
          unless canceled before the trial ends.
        </p>
      </LegalSection>

      <LegalSection heading="Payments">
        <p>Subscription fees are billed through Stripe.</p>
        <p className="mt-3">Failure to pay may result in suspension or termination of your account.</p>
      </LegalSection>

      <LegalSection heading="Cancellation">
        <p>You may cancel your subscription at any time.</p>
        <p className="mt-3">
          Cancellation prevents future billing but does not automatically generate refunds for prior
          charges unless required by law.
        </p>
      </LegalSection>

      <LegalSection heading="Refund Policy">
        <p>
          We offer a <strong>7-Day Free Trial</strong> so new customers can evaluate our platform
          before being charged.
        </p>
        <p className="mt-3">After a paid subscription begins:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Subscription fees are generally non-refundable.</li>
          <li>You may cancel your subscription at any time.</li>
          <li>Cancellation prevents future billing but does not automatically entitle you to a refund for prior payments.</li>
          <li>Refunds may be issued at our sole discretion or where required by applicable law.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Customer Communications">
        <p>
          You are solely responsible for ensuring that all communications sent through our platform
          comply with applicable laws and regulations, including obtaining any required consent.
        </p>
      </LegalSection>

      <LegalSection heading="SMS Compliance Policy">
        <p>Roof AI Lead Recovery sends SMS messages only on behalf of your business.</p>
        <p className="mt-3">By using our services, you represent and warrant that:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>You have obtained all legally required consent before sending SMS communications to your customers.</li>
          <li>Your business complies with the Telephone Consumer Protection Act (TCPA), CAN-SPAM Act, CTIA Messaging Principles, and all other applicable laws and regulations.</li>
          <li>You will honor customer opt-out requests promptly.</li>
          <li>You will not use Roof AI Lead Recovery to send prohibited, deceptive, or unsolicited messages.</li>
        </ul>
        <p className="mt-3">
          Recipients may opt out of receiving text messages by replying <strong>STOP</strong>.
        </p>
        <p className="mt-3">Standard message and data rates may apply.</p>
        <p className="mt-3">
          Your business is solely responsible for ensuring compliance with all applicable messaging laws.
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable Use Policy">
        <p>
          By using Roof AI Lead Recovery, you agree to use the platform responsibly and in compliance
          with all applicable laws. You may not use the platform to:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Send spam or unsolicited messages</li>
          <li>Send misleading or fraudulent communications</li>
          <li>Harass, threaten, or abuse individuals</li>
          <li>Violate federal, state, or local laws</li>
          <li>Infringe on another person's privacy or intellectual property</li>
          <li>Upload malicious software or attempt to disrupt the platform</li>
          <li>Use the service for any unlawful purpose</li>
          <li>Attempt to gain unauthorized access to our systems or other customer accounts</li>
          <li>Resell or sublicense the service without our written permission</li>
        </ul>
        <p className="mt-3">
          Roof AI Lead Recovery reserves the right to suspend or terminate any account that violates
          this policy without prior notice.
        </p>
      </LegalSection>

      <LegalSection heading="AI Communication Disclosure">
        <p>
          Roof AI Lead Recovery uses artificial intelligence to communicate with prospective customers
          on your behalf. While our AI is designed to provide fast, accurate, and helpful responses,
          AI-generated communications may occasionally contain errors, misunderstand context, or
          require human review.
        </p>
        <p className="mt-3">By using our platform, you acknowledge and agree that:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>AI-generated responses are automated.</li>
          <li>Responses may not always be perfect or appropriate for every situation.</li>
          <li>Your business is responsible for reviewing important customer communications when necessary.</li>
          <li>Roof AI Lead Recovery is not responsible for decisions made solely based on AI-generated responses.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Third-Party Services">
        <p>
          Our platform integrates with third-party providers including Smith.ai, Stripe, Google
          Calendar, and other services. We are not responsible for outages, errors, or interruptions
          caused by third-party providers.
        </p>
      </LegalSection>

      <LegalSection heading="Service Availability">
        <p>
          While we strive for reliable service, we do not guarantee uninterrupted or error-free
          operation. Service interruptions may occur due to:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Scheduled maintenance</li>
          <li>Software updates</li>
          <li>Internet or network failures</li>
          <li>Third-party service outages</li>
          <li>Events beyond our reasonable control</li>
        </ul>
        <p className="mt-3">
          We will make commercially reasonable efforts to restore service as quickly as possible.
        </p>
      </LegalSection>

      <LegalSection heading="No Guarantee of Results">
        <p>
          Roof AI Lead Recovery is designed to help roofing companies respond to missed customer
          inquiries more quickly, improve customer engagement, and increase opportunities to schedule
          appointments. However, <strong>we do not guarantee any specific business results</strong>,
          including but not limited to:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>A specific number of recovered leads or booked appointments</li>
          <li>Increased sales, revenue, or profit</li>
          <li>Improved customer retention or competitive advantage</li>
          <li>Any specific conversion rate or closing percentage</li>
        </ul>
        <p className="mt-3">
          Our software is a communication and lead recovery platform. It is designed to help your
          business respond faster to missed opportunities, but it is <strong>not a substitute for
          effective customer service, sales practices, marketing, or business management.</strong>
        </p>
        <p className="mt-3">
          No statement made on our website, in demonstrations, marketing materials, or conversations
          with our team shall be interpreted as a guarantee of future performance or business results.
        </p>
      </LegalSection>

      <LegalSection heading="Marketing and Testimonial Disclaimer">
        <p>
          Any examples, illustrations, testimonials, case studies, statistics, or revenue estimates
          displayed on our website or in marketing materials are provided for informational purposes
          only. These examples should not be interpreted as promises or guarantees that your business
          will achieve similar results.
        </p>
        <p className="mt-3">
          Individual customer experiences vary based on numerous factors including market conditions,
          business operations, responsiveness, pricing, competition, and customer demand. Past
          performance is not indicative of future results.
        </p>
      </LegalSection>

      <LegalSection heading="Intellectual Property">
        <p>
          All software, trademarks, branding, content, and technology remain the exclusive property
          of Roof AI Lead Recovery. You may not copy, reverse engineer, redistribute our software,
          or use our branding without written permission.
        </p>
      </LegalSection>

      <LegalSection heading="Limitation of Liability">
        <p>
          To the fullest extent permitted by law, Roof AI Lead Recovery shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages, including lost profits,
          lost business opportunities, or data loss arising from the use of our services.
        </p>
        <p className="mt-3">
          Our total liability for any claim shall not exceed the amount you paid to Roof AI Lead
          Recovery during the three (3) months preceding the event giving rise to the claim.
        </p>
      </LegalSection>

      <LegalSection heading="Indemnification">
        <p>
          You agree to indemnify and hold harmless Roof AI Lead Recovery, its owners, employees,
          contractors, and affiliates from claims arising out of your use of the platform, violation
          of these Terms, violation of applicable laws, or customer communications sent through your
          account.
        </p>
      </LegalSection>

      <LegalSection heading="Termination">
        <p>
          We reserve the right to suspend or terminate accounts that violate these Terms, abuse the
          platform, engage in fraudulent activity, or fail to make required payments.
        </p>
      </LegalSection>

      <LegalSection heading="Force Majeure">
        <p>
          Roof AI Lead Recovery shall not be liable for delays or failures to perform resulting from
          causes beyond our reasonable control, including natural disasters, power outages, internet
          failures, cyberattacks, government actions, labor disputes, pandemic-related disruptions,
          or third-party provider outages.
        </p>
      </LegalSection>

      <LegalSection heading="Governing Law">
        <p>
          These Terms shall be governed by the laws of the State of Ohio, without regard to conflict
          of law principles.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to These Terms">
        <p>
          We may modify these Terms at any time. Updated versions will be posted on this page with a
          revised effective date. Continued use of the platform constitutes acceptance of the updated
          Terms.
        </p>
      </LegalSection>

      <LegalSection heading="Contact Information">
        <p className="font-semibold text-ink">Roof AI Lead Recovery</p>
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
