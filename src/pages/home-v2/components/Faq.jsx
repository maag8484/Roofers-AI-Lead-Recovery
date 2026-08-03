import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { Reveal, SectionLabel, SplitText, CtaButton } from "./primitives";
import { FAQS } from "../content";

/**
 * FAQ — sticky framing on the left, accordion on the right.
 *
 * Page-local accordion (the shared Radix one carries fixed light-mode
 * styling), matching the live page's single-select collapsible behaviour.
 * Copy verbatim.
 */
export function Faq() {
  const [open, setOpen] = useState(0);
  const reduce = useReducedMotion();

  // No overflow-hidden on the section: the left rail is `position: sticky`
  // and a clipped ancestor would stop it pinning.
  return (
    <section id="faq" className="relative bg-[var(--void)] py-24 sm:py-28">
      <div className="relative mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          {/* Sticky rail */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <SectionLabel index="09" eyebrow="FAQ" />
              <h2 className="hv2-display mt-7 text-[clamp(2rem,4.4vw,2.9rem)] text-[var(--text)]">
                <SplitText text="Frequently asked" />{" "}
                <span className="hv2-accent hv2-grad-text">questions</span>
              </h2>
              <p className="mt-5 max-w-sm text-[16.5px] leading-[1.7] text-[var(--text-dim)]">
                Still deciding? Start the trial — there's no contract and no sales call.
              </p>
              <div className="mt-8">
                <CtaButton>Start Free Trial</CtaButton>
              </div>
            </Reveal>
          </div>

          {/* Accordion */}
          <div className="space-y-3">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <motion.div
                  key={f.q}
                  initial={reduce ? false : { opacity: 0, y: 18 }}
                  whileInView={reduce ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ delay: i * 0.06, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div
                    className={[
                      "overflow-hidden rounded-[1.25rem] border transition-all duration-300",
                      isOpen
                        ? "border-[var(--acid)]/35 bg-[var(--acid)]/[0.05]"
                        : "border-[var(--line)] bg-[var(--glass)] hover:border-[var(--line-2)]",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-5 px-6 py-5 text-left sm:px-7"
                    >
                      <span className="flex items-center gap-4">
                        <span
                          className={[
                            "hv2-mono text-[11.5px] font-bold transition-colors duration-300",
                            isOpen ? "text-[var(--acid)]" : "text-[var(--text-faint)]",
                          ].join(" ")}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={[
                            "text-[16.5px] font-bold transition-colors duration-300 sm:text-[17.5px]",
                            isOpen ? "text-[var(--acid)]" : "text-[var(--text)]",
                          ].join(" ")}
                        >
                          {f.q}
                        </span>
                      </span>
                      <motion.span
                        animate={{ rotate: isOpen ? 135 : 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className={[
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                          isOpen
                            ? "bg-[var(--acid)] text-white"
                            : "bg-[var(--mist)] text-[var(--text-dim)]",
                        ].join(" ")}
                      >
                        <Plus className="h-4 w-4" strokeWidth={2.8} />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={reduce ? false : { height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={reduce ? undefined : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="px-6 pb-6 pl-[3.6rem] text-[15.5px] leading-[1.75] text-[var(--text-dim)] sm:px-7 sm:pl-[4.1rem]">
                            {f.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
