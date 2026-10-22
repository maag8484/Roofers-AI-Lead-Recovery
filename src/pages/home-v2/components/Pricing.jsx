import { Check } from "lucide-react";
import { CtaButton, SectionLabel } from "./primitives";
import { PLAN_FEATURES } from "../content";

export function Pricing() {
  return <section id="pricing" className="relative bg-[var(--void)] py-24 sm:py-28">
    <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
      <SectionLabel index="05" eyebrow="Pricing" />
      <h2 className="hv2-display mt-7 text-[clamp(2rem,4.4vw,3rem)] text-[var(--text)]">Start free. Pay only if it catches work.</h2>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <article className="hv2-glass rounded-3xl p-8">
          <h3 className="hv2-display text-xl text-[var(--text)]">Step 1 — Free Missed-Call Audit</h3>
          <p className="mt-5 leading-relaxed text-[var(--text-dim)]">$0. We review your recent call history and show you how many legitimate opportunities went unanswered. No obligation either way.</p>
        </article>
        <article className="hv2-glass rounded-3xl p-8">
          <h3 className="hv2-display text-xl text-[var(--text)]">Step 2 — Free 30-Day Pilot</h3>
          <p className="mt-5 leading-relaxed text-[var(--text-dim)]">$0 for 30 days. Your overflow calls answered and qualified on your real phone line, with a full report at the end of what it caught. Fair use: up to 40 recovered calls during the pilot.</p>
          <a href="/signup" className="mt-6 inline-block font-bold underline text-[var(--acid)]">Start the free 30-day pilot</a>
        </article>
        <article className="hv2-frame rounded-3xl bg-[var(--surface)] p-8">
          <h3 className="hv2-display text-xl text-[var(--text)]">Step 3 — Keep It Running</h3>
          <p className="mt-5 text-2xl font-bold text-[var(--text)]">Founding rate: $149/month — locked for 12 months.</p>
          <p className="mt-3 text-[var(--text-dim)]">For the first 10 customers. Standard price is $299/month.</p>
          <ul className="mt-7 space-y-3">{PLAN_FEATURES.map(f => <li key={f} className="flex gap-3 text-sm text-[var(--text-dim)]"><Check aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--acid)]" />{f}</li>)}</ul>
        </article>
      </div>
      <p className="mt-8 text-[var(--text-dim)]">No setup fees · No contracts · Cancel anytime from your dashboard</p>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--text-dim)]">Pilot eligibility: operating roofing companies with a forwardable business line; one pilot per company. Missed-call and after-hours overflow only — your team answers first. Up to 40 recovered calls over 30 days. The pilot ends automatically unless you choose to continue; no automatic paid conversion.</p>
      <div className="mt-8"><CtaButton>Get My Free Missed-Call Audit</CtaButton></div>
    </div>
  </section>;
}
