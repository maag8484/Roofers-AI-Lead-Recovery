import { SEARCH_GUIDES } from "@/config/search";

export function RecoveryGuides() {
  return (
    <section id="roofing-call-guides" aria-labelledby="recovery-guides-title" className="border-y border-[var(--line)] bg-[var(--deep)] py-16 sm:py-20">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <p className="hv2-eyebrow text-[var(--acid)]">Roofing call recovery resources</p>
        <h2 id="recovery-guides-title" className="hv2-display mt-4 max-w-3xl text-3xl text-[var(--text)] sm:text-4xl">
          Choose the right coverage for the calls your team misses.
        </h2>
        <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[var(--text-dim)]">
          Start with your current phone process. These guides explain what to compare,
          what to configure and how to measure a real next step for the homeowner.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {SEARCH_GUIDES.map((guide) => (
            <a key={guide.href} href={guide.href} className="rounded-2xl border border-[var(--line-2)] bg-[var(--glass)] p-6 transition-colors hover:border-[var(--brand-600)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--acid)]">
              <h3 className="text-lg font-bold text-[var(--text)]">{guide.title} <span aria-hidden="true">→</span></h3>
              <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">{guide.description}</p>
            </a>
          ))}
        </div>
        <p className="mt-7 text-sm leading-7 text-[var(--text-dim)]">
          Put your call history into the <a className="font-bold text-[var(--acid)] underline underline-offset-4" href="/how-much-are-missed-calls-costing-your-roofing-company/">missed-call revenue calculator</a>,
          or <a className="font-bold text-[var(--acid)] underline underline-offset-4" href="/#inquiry">request a callback</a> to review your workflow.
        </p>
      </div>
    </section>
  );
}
