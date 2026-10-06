import { SectionLabel, SplitText, Reveal, CtaButton } from "./primitives";

/**
 * Evidence-first value section. It deliberately avoids presenting a sample
 * contract value or a modeled return as a customer result.
 */
export function TheMath() {
  const checks = [
    {
      label: "Unique missed callers",
      detail: "Remove repeat attempts, spam, vendors and existing-customer calls.",
    },
    {
      label: "Legitimate new opportunities",
      detail: "Confirm service area, roofing need, capacity and the caller's requested next step.",
    },
    {
      label: "Verified outcomes",
      detail: "Keep callback requests, confirmed inspections, signed jobs and collected revenue separate.",
    },
  ];

  return (
    <section className="hv2-grain hv2-dots relative overflow-hidden border-y border-[var(--line)] bg-[var(--deep)] py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="hv2-aurora hv2-aurora-a pointer-events-none"
        style={{
          top: "-16%",
          left: "-6%",
          width: "40rem",
          height: "40rem",
          background: "radial-gradient(circle, rgba(16,185,129,0.1), transparent 68%)",
        }}
      />

      <div className="relative mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="max-w-3xl">
          <SectionLabel index="06" eyebrow="Measure Before You Scale" />
          <h2 className="hv2-display mt-7 text-[clamp(2.1rem,5vw,3.4rem)] text-[var(--text)]">
            <SplitText text="Use your call history—not" />{" "}
            <span className="hv2-accent hv2-grad-text">a made-up ROI claim</span>
          </h2>
          <Reveal delay={0.2}>
            <p className="mt-5 max-w-2xl text-[17px] leading-[1.75] text-[var(--text-dim)]">
              A missed call is not automatically a lost job. Build a baseline from one recent,
              comparable period and trace each legitimate opportunity to its actual next step.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {checks.map((check, index) => (
            <Reveal key={check.label} delay={index * 0.08}>
              <div className="hv2-glass h-full rounded-[1.5rem] p-7">
                <p className="hv2-mono text-[12px] font-bold text-[var(--acid)]">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="hv2-display mt-4 text-[20px] text-[var(--text)]">
                  {check.label}
                </h3>
                <p className="mt-3 text-[15px] leading-[1.7] text-[var(--text-dim)]">
                  {check.detail}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-12 flex flex-col items-start justify-between gap-6 border-t border-[var(--line)] pt-10 md:flex-row md:items-center">
            <p className="max-w-2xl text-[16.5px] leading-[1.75] text-[var(--text-dim)]">
              Use the free calculator for a planning scenario, then request an audit to compare
              the assumptions with your own records. Estimates are not guaranteed revenue.
            </p>
            <CtaButton
              to="/how-much-are-missed-calls-costing-your-roofing-company/"
              reloadDocument
              magnetic={false}
            >
              Calculate With My Numbers
            </CtaButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
