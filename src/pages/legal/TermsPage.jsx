import { LegalLayout, LegalSection } from "@/components/marketing/LegalLayout";

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="June 23, 2026">
      <p>
        These Terms of Service ("Terms") govern your use of Roof AI Lead Recovery ("Service"),
        operated by Roof AI Lead Recovery ("we", "us", "our"). By creating an account or using
        the Service, you agree to be bound by these Terms.
      </p>

      <LegalSection heading="1. The Service">
        <p>
          Roof AI Lead Recovery is a software platform that helps roofing companies recover missed
          calls by automatically responding to callers via SMS, qualifying leads, and booking
          inspection appointments on your connected Google Calendar. The Service includes a
          customer dashboard, business phone number provisioning, and a real-time appointment feed.
        </p>
      </LegalSection>

      <LegalSection heading="2. Eligibility">
        <p>
          You must be at least 18 years old and a legally operating business to use this Service.
          By creating an account, you represent that all information you provide is accurate and
          that you have the authority to bind your business to these Terms.
        </p>
      </LegalSection>

      <LegalSection heading="3. Billing & Subscription">
        <p>
          The Service is billed at <strong>$299/month</strong>. Subscriptions renew automatically
          at the end of each billing period until canceled. There are no setup fees.
        </p>
        <p className="mt-3">
          You may cancel your subscription at any time from the Billing section of your dashboard.
          Cancellation takes effect at the end of the current billing period — you retain access
          until then. We do not provide refunds for partial billing periods.
        </p>
        <p className="mt-3">
          Payments are processed securely by Stripe. By providing payment information, you
          authorize us to charge your payment method on a recurring basis.
        </p>
      </LegalSection>

      <LegalSection heading="4. SMS Messaging Terms">
        <p>
          By using the Service, you agree to the following SMS messaging terms which comply with
          TCPA and carrier requirements:
        </p>
        <p className="mt-3">
          <strong>Program description:</strong> Roof AI Lead Recovery sends automated SMS messages
          to homeowners who have called your business phone number, to follow up on their inquiry
          and schedule a free roof inspection.
        </p>
        <p className="mt-3">
          <strong>Consent:</strong> Homeowners provide implied consent to receive SMS by calling
          the business phone number. No marketing messages are sent to unconsented recipients.
        </p>
        <p className="mt-3">
          <strong>Message frequency:</strong> Message frequency varies. Recipients may receive up
          to 5 messages per inquiry.
        </p>
        <p className="mt-3">
          <strong>Message & data rates:</strong> Standard message and data rates may apply.
        </p>
        <p className="mt-3">
          <strong>Opt-out:</strong> Recipients can opt out at any time by replying <strong>STOP</strong>.
          After opting out, one confirmation message is sent and no further messages will be
          delivered to that number.
        </p>
        <p className="mt-3">
          <strong>Help:</strong> Recipients can reply <strong>HELP</strong> for assistance or
          contact{" "}
          <a className="text-brand-600 hover:underline" href="mailto:hello@roofaileadrecovery.com">
            hello@roofaileadrecovery.com
          </a>.
        </p>
        <p className="mt-3">
          <strong>Supported carriers:</strong> All major US carriers. Carrier is not liable for
          delayed or undelivered messages.
        </p>
      </LegalSection>

      <LegalSection heading="5. Acceptable Use">
        <p>You agree to use the Service in compliance with all applicable laws, including:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>The Telephone Consumer Protection Act (TCPA)</li>
          <li>CAN-SPAM Act</li>
          <li>CTIA Messaging Principles and Best Practices</li>
          <li>All applicable state and local laws</li>
        </ul>
        <p className="mt-3">You agree NOT to:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Use the Service to send spam, unsolicited, or harassing messages</li>
          <li>Use the Service for any unlawful purpose</li>
          <li>Attempt to reverse-engineer or misuse the platform</li>
          <li>Resell or sublicense the Service without written permission</li>
        </ul>
      </LegalSection>

      <LegalSection heading="6. Third-Party Services">
        <p>
          The Service integrates with the following third-party providers. Your use of the Service
          is also subject to their respective terms:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li><strong>Stripe</strong> — payment processing (stripe.com/legal)</li>
          <li><strong>Twilio</strong> — phone and SMS services (twilio.com/legal/tos)</li>
          <li><strong>Google</strong> — calendar integration (policies.google.com/terms)</li>
        </ul>
        <p className="mt-3">
          We are not responsible for the availability or accuracy of third-party services.
        </p>
      </LegalSection>

      <LegalSection heading="7. Intellectual Property">
        <p>
          All content, features, and functionality of the Service are owned by Roof AI Lead
          Recovery and protected by applicable intellectual property laws. You may not copy,
          modify, or distribute any part of the Service without prior written consent.
        </p>
      </LegalSection>

      <LegalSection heading="8. Disclaimers">
        <p>
          The Service is provided on an "as is" and "as available" basis without warranties of any
          kind, express or implied. We do not guarantee that the Service will be uninterrupted,
          error-free, or that every missed call will be recovered or every lead converted.
        </p>
      </LegalSection>

      <LegalSection heading="9. Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable law, Roof AI Lead Recovery shall not be
          liable for any indirect, incidental, special, consequential, or punitive damages,
          including but not limited to lost profits, lost leads, or business interruption, whether
          based on contract, tort, or any other legal theory, even if we have been advised of the
          possibility of such damages.
        </p>
        <p className="mt-3">
          Our total liability to you for any claims arising from use of the Service shall not
          exceed the amount you paid us in the three months preceding the claim.
        </p>
      </LegalSection>

      <LegalSection heading="10. Termination">
        <p>
          We may suspend or terminate your account for violation of these Terms, non-payment, or
          any conduct that we determine to be harmful to the Service or other users. You may
          terminate your account at any time by canceling your subscription and contacting support.
        </p>
      </LegalSection>

      <LegalSection heading="11. Governing Law">
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the United
          States. Any disputes shall be resolved through binding arbitration rather than in court,
          except that either party may seek injunctive relief in court for intellectual property
          violations.
        </p>
      </LegalSection>

      <LegalSection heading="12. Changes to Terms">
        <p>
          We reserve the right to modify these Terms at any time. We will notify you of material
          changes by email or via a notice in the dashboard. Continued use of the Service after
          changes constitutes your acceptance of the updated Terms.
        </p>
      </LegalSection>

      <LegalSection heading="13. Contact">
        <p>
          Questions about these Terms? Contact us at{" "}
          <a className="text-brand-600 hover:underline" href="mailto:hello@roofaileadrecovery.com">
            hello@roofaileadrecovery.com
          </a>{" "}
          or visit{" "}
          <a className="text-brand-600 hover:underline" href="https://roofaileadrecovery.com">
            roofaileadrecovery.com
          </a>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
