import { LegalLayout, LegalSection } from "@/components/marketing/LegalLayout";

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="June 17, 2026">
      <p>
        These Terms of Service ("Terms") govern your use of Roof AI Lead Recovery. By creating an
        account you agree to these Terms. This is a template and should be reviewed by legal
        counsel before launch.
      </p>

      <LegalSection heading="The Service">
        <p>
          Roof AI Lead Recovery responds to missed calls, web leads, and after-hours inquiries and
          books appointments to your connected calendar. Features and automation are provided on an
          "as is" basis.
        </p>
      </LegalSection>

      <LegalSection heading="Billing">
        <p>
          The service costs $299/month after any trial period. Plans renew automatically until
          canceled. There are no setup fees, and you may cancel anytime from your dashboard;
          cancellation takes effect at the end of the current billing period.
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable Use">
        <p>
          You agree to use the service in compliance with applicable laws, including telephone and
          messaging regulations (such as TCPA). You are responsible for the content of messages
          sent on your behalf and for obtaining any required consents.
        </p>
      </LegalSection>

      <LegalSection heading="Third-Party Services">
        <p>
          The service integrates with Stripe, Twilio, and Google. Your use of those services is
          also governed by their respective terms.
        </p>
      </LegalSection>

      <LegalSection heading="Limitation of Liability">
        <p>
          To the maximum extent permitted by law, we are not liable for indirect, incidental, or
          consequential damages, including lost profits or missed leads arising from service
          interruptions.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about these Terms? Email{" "}
          <a className="text-brand-600 hover:underline" href="mailto:hello@roofaileadrecovery.com">
            hello@roofaileadrecovery.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
