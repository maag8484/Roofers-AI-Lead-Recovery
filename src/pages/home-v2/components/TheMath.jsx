import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { SectionLabel, SplitText, Reveal, CtaButton, useCountUp } from "./primitives";

/**
 * The ROI section — the page's signature moment.
 *
 * $12,000 is set at display scale against a full-width bar; $299 sits beneath
 * it as a 2.4% stub on the same axis, after a deliberate beat of stillness.
 * Turning the ratio into a length the eye measures pre-verbally is what makes
 * 40x land — three equal-weight cards leave the reader to do the division.
 *
 * All copy verbatim.
 */
export function TheMath() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduce = useReducedMotion();

  const job = useCountUp(12000, { start: inView, duration: 1600, delay: 1100 });
  const pay = useCountUp(299, { start: inView, duration: 700, delay: 0 });
  const mult = useCountUp(40, { start: inView, duration: 700, delay: 2900 });

  const jobV = reduce ? 12000 : job;
  const payV = reduce ? 299 : pay;
  const multV = reduce ? 40 : mult;

  return (
    <section
      ref={ref}
      className="hv2-grain hv2-dots relative overflow-hidden border-y border-[var(--line)] bg-[var(--deep)] py-24 sm:py-32"
    >
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
        <div className="max-w-2xl">
          <SectionLabel index="06" eyebrow="Simple ROI Calculator" />
          <h2 className="hv2-display mt-7 text-[clamp(2.1rem,5vw,3.4rem)] text-[var(--text)]">
            <SplitText text="Recover just one" />{" "}
            <span className="hv2-accent hv2-grad-text">roofing job…</span>
          </h2>
          <Reveal delay={0.2}>
            <p className="mt-5 text-[17px] text-[var(--text-dim)]">That's all it takes.</p>
          </Reveal>
        </div>

        {/* ---------- The axis ---------- */}
        <div className="mt-20 space-y-14">
          <div>
            <p className="hv2-eyebrow text-[var(--text-faint)]">
              Average roof replacement value
            </p>
            <p className="hv2-display hv2-mono mt-4 text-[clamp(3.4rem,12vw,8rem)] leading-[0.85] text-[var(--text)]">
              ${jobV.toLocaleString("en-US")}
              <span className="align-top text-[0.32em] text-[var(--acid)]">+</span>
            </p>
            <div className="mt-7 h-[10px] w-full overflow-hidden rounded-full bg-[var(--mist)]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[var(--brand)] via-[var(--brand-bright)] to-[var(--acid)]"
                initial={reduce ? false : { width: 0 }}
                animate={inView ? { width: "100%" } : {}}
                transition={{ delay: 1.1, duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                style={reduce ? { width: "100%" } : undefined}
              />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="hv2-eyebrow text-[var(--text-faint)]">Monthly investment</p>
                <p className="hv2-display hv2-mono mt-4 text-[clamp(1.8rem,4vw,2.6rem)] leading-none text-[var(--acid)]">
                  ${payV.toLocaleString("en-US")}
                </p>
              </div>
              <p className="hv2-eyebrow text-[var(--text-faint)]">2.4% of one job</p>
            </div>
            <div className="mt-7 h-[10px] w-full overflow-hidden rounded-full bg-[var(--mist)]">
              <motion.div
                className="h-full rounded-full bg-[var(--acid)]"
                initial={reduce ? false : { width: 0 }}
                animate={inView ? { width: "2.4%" } : {}}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                style={reduce ? { width: "2.4%" } : undefined}
              />
            </div>
          </div>
        </div>

        {/* ---------- The multiple ---------- */}
        <div className="mt-16 grid gap-10 border-t border-[var(--line)] pt-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="hv2-display hv2-mono hv2-grad-text text-[clamp(3.5rem,9vw,6.5rem)] leading-none">
              {multV}x
            </p>
            <p className="hv2-eyebrow mt-4 text-[var(--text-faint)]">
              Return on just one recovered job
            </p>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <Reveal>
              <p className="text-[clamp(1.2rem,2.3vw,1.6rem)] font-bold leading-[1.5] text-[var(--text)]">
                One recovered customer could pay for your subscription{" "}
                <span className="hv2-accent text-[var(--acid)]">many times over.</span>
              </p>
              <p className="mt-6 text-[16.5px] leading-[1.75] text-[var(--text-dim)]">
                Instead of thinking <span className="hv2-accent">"$299 is expensive"</span> — ask
                yourself:{" "}
                <span className="font-bold text-[var(--text)]">
                  "Can I afford to keep missing calls?"
                </span>
              </p>
              <div className="mt-10">
                <CtaButton>Start Your Free Trial</CtaButton>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
