import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X, Check } from "lucide-react";
import { Reveal, SectionLabel, SplitText } from "./primitives";
import { COMPARISON_ROWS } from "../content";

/**
 * "Can You Afford NOT to Have This?" — two opposed stacks.
 *
 * Hovering either side dims the other, so the reader can pit the columns
 * against each other. A neutral table reads as data; this reads as a choice,
 * which is what the copy is asking them to make.
 */
export function ComparisonTable() {
  const [side, setSide] = useState(null);
  const reduce = useReducedMotion();

  const dim = (which) => (side && side !== which ? "opacity-35" : "opacity-100");

  return (
    <section className="hv2-grain relative overflow-hidden border-y border-[var(--line)] bg-[var(--deep)] py-24 sm:py-28">
      <div className="relative mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal className="flex justify-center">
            <SectionLabel index="08" eyebrow="The Real Question" />
          </Reveal>
          <h2 className="hv2-display mt-7 text-[clamp(2rem,4.6vw,3.1rem)] text-[var(--text)]">
            <SplitText text="Can you afford" />{" "}
            <span className="hv2-accent text-[var(--rose)]">NOT to have this?</span>
          </h2>
          <Reveal delay={0.2}>
            <p className="mx-auto mt-5 max-w-xl text-[17px] leading-[1.7] text-[var(--text-dim)]">
              Instead of asking 'should I spend $299?' — ask yourself what you're losing every
              month without it.
            </p>
          </Reveal>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-5 md:grid-cols-2 md:gap-6">
          {/* Without */}
          <motion.div
            onHoverStart={() => setSide("without")}
            onHoverEnd={() => setSide(null)}
            initial={reduce ? false : { opacity: 0, x: -30 }}
            whileInView={reduce ? {} : { opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={[
              "hv2-glass rounded-[1.75rem] p-7 transition-all duration-500 sm:p-8",
              dim("without"),
            ].join(" ")}
          >
            <div className="flex items-center gap-3 border-b border-[var(--line)] pb-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--rose)]/15">
                <X className="h-5 w-5 text-[var(--rose)]" strokeWidth={3} />
              </span>
              <p className="hv2-display text-[18px] text-[var(--rose)]">Without Roof AI</p>
            </div>

            <ul className="mt-6 space-y-4">
              {COMPARISON_ROWS.map((r, i) => (
                <motion.li
                  key={r.without}
                  initial={reduce ? false : { opacity: 0, x: -16 }}
                  whileInView={reduce ? {} : { opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.5 }}
                  className="flex items-start gap-3 text-[15px] leading-[1.6] text-[var(--text-faint)]"
                >
                  <X className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--rose)]/70" strokeWidth={3} />
                  {r.without}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* With */}
          <motion.div
            onHoverStart={() => setSide("with")}
            onHoverEnd={() => setSide(null)}
            initial={reduce ? false : { opacity: 0, x: 30 }}
            whileInView={reduce ? {} : { opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={[
              "hv2-frame rounded-[1.75rem] transition-all duration-500",
              dim("with"),
            ].join(" ")}
          >
            <div className="relative rounded-[1.75rem] bg-[var(--surface)]/80 p-7 backdrop-blur-xl sm:p-8">
              <div className="flex items-center gap-3 border-b border-[var(--line)] pb-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--acid)]/15">
                  <Check className="h-5 w-5 text-[var(--acid)]" strokeWidth={3} />
                </span>
                <p className="hv2-display text-[18px] text-[var(--acid)]">With Roof AI</p>
              </div>

              <ul className="mt-6 space-y-4">
                {COMPARISON_ROWS.map((r, i) => (
                  <motion.li
                    key={r.with}
                    initial={reduce ? false : { opacity: 0, x: 16 }}
                    whileInView={reduce ? {} : { opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ delay: 0.1 + i * 0.07, duration: 0.5 }}
                    className="flex items-start gap-3 text-[15px] font-medium leading-[1.6] text-[var(--text)]"
                  >
                    <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--acid)]" strokeWidth={3} />
                    {r.with}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        <Reveal delay={0.12}>
          <p className="mt-10 text-center text-[15px] text-[var(--text-dim)]">
            People buy because they don't want the left column.{" "}
            <span className="font-bold text-[var(--text)]">
              Which column are you in right now?
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
