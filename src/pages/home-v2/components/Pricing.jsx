import { Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Reveal, SectionLabel, SplitText, CtaButton, Spotlight } from "./primitives";
import { PLAN_FEATURES, PLAN_TRUST, WHY_ROOFERS_JOIN } from "../content";

/**
 * Pricing — asymmetric split. The plan card sticks while "Why Roofers Join"
 * scrolls past, so the price stays in sight exactly while the justification is
 * being read.
 *
 * The plan carries the page's only gradient frame, which is what marks it as
 * the focal object without a rotating halo.
 */
export function Pricing() {
  const reduce = useReducedMotion();

  // No overflow-hidden on the section: the plan card is `position: sticky`
  // and a clipped ancestor would stop it pinning.
  return (
    <section id="pricing" className="relative bg-[var(--void)] py-24 sm:py-28">
      <div aria-hidden="true" className="hv2-clip">
        <div
          className="hv2-aurora hv2-aurora-b"
          style={{
            top: "6%",
            left: "-8%",
            width: "38rem",
            height: "38rem",
            background: "radial-gradient(circle, rgba(37,99,235,0.14), transparent 68%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="max-w-2xl">
          <SectionLabel index="05" eyebrow="Pricing" />
          <h2 className="hv2-display mt-7 text-[clamp(2rem,4.4vw,3rem)] text-[var(--text)]">
            <SplitText text="Recover more roofing jobs for" />{" "}
            <span className="hv2-accent hv2-grad-text">less than the profit from one roof</span>
          </h2>
          <Reveal delay={0.2}>
            <p className="mt-5 text-[17px] leading-[1.65] text-[var(--text-dim)]">
              One plan. Everything included. No surprises.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16">
          {/* ---------------- Sticky plan ---------------- */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal scale={0.96}>
              <div className="hv2-frame relative rounded-[1.9rem]">
                <div className="relative rounded-[1.9rem] bg-[var(--surface)]/90 p-8 backdrop-blur-xl sm:p-9">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="hv2-display text-[19px] text-[var(--text)]">
                      Roof AI Lead Recovery
                    </h3>
                    <span className="hv2-sticker shrink-0 rounded-full bg-[var(--acid)] px-3 py-1.5 text-[11.5px] font-extrabold text-white">
                      7-Day Free Trial
                    </span>
                  </div>

                  <div className="mt-6 flex items-end gap-2">
                    <span className="hv2-display hv2-mono text-[clamp(3.2rem,9vw,4.2rem)] leading-none text-[var(--text)]">
                      $299
                    </span>
                    <span className="mb-2 text-[15px] font-semibold text-[var(--text-faint)]">
                      /month
                    </span>
                  </div>
                  <p className="mt-2 text-[14px] text-[var(--text-faint)]">
                    No setup fees. Cancel anytime.
                  </p>

                  <ul className="mt-7 space-y-3 border-t border-[var(--line)] pt-7">
                    {PLAN_FEATURES.map((f, i) => (
                      <motion.li
                        key={f}
                        initial={reduce ? false : { opacity: 0, x: -14 }}
                        whileInView={reduce ? {} : { opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.6 }}
                        transition={{ delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-start gap-3 text-[14.5px] text-[var(--text-dim)]"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--acid)]/15">
                          <Check className="h-3 w-3 text-[var(--acid)]" strokeWidth={4} />
                        </span>
                        {f}
                      </motion.li>
                    ))}
                  </ul>

                  <CtaButton className="mt-8 w-full" magnetic={false}>
                    Start Recovering Missed Leads
                  </CtaButton>

                  <ul className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-[var(--line)] pt-5">
                    {PLAN_TRUST.map((t) => (
                      <li
                        key={t}
                        className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text-faint)]"
                      >
                        <Check className="h-3 w-3 shrink-0 text-[var(--acid)]" strokeWidth={3.5} />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>

          {/* ---------------- Why Roofers Join ---------------- */}
          <div>
            <Reveal>
              <SectionLabel eyebrow="Why Roofers Join" />
              <h3 className="hv2-display mt-5 text-[clamp(1.7rem,3.8vw,2.4rem)] text-[var(--text)]">
                Not just a feature.{" "}
                <span className="hv2-accent text-[var(--acid)]">A revenue safety net.</span>
              </h3>
              <p className="mt-4 text-[16.5px] leading-[1.7] text-[var(--text-dim)]">
                Roof AI doesn't add work to your plate — it recovers the revenue you were
                already losing.
              </p>
            </Reveal>

            <div className="mt-10 space-y-4">
              {WHY_ROOFERS_JOIN.map((b, i) => (
                <motion.div
                  key={b.title}
                  initial={reduce ? false : { opacity: 0, y: 30 }}
                  whileInView={reduce ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ delay: i * 0.1, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                  className="group"
                >
                  <Spotlight className="hv2-glass hv2-lift flex items-start gap-5 rounded-[1.5rem] p-7">
                    <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand)]/20 text-3xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                      {b.emoji}
                    </span>
                    <div className="relative">
                      <h4 className="hv2-display text-[19px] text-[var(--text)]">{b.title}</h4>
                      <p className="mt-2 text-[15.5px] leading-[1.7] text-[var(--text-dim)]">
                        {b.desc}
                      </p>
                    </div>
                  </Spotlight>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
