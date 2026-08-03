import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { Phone, MessageSquare, Calendar, Bot, ClipboardCheck, ArrowRight } from "lucide-react";
import { Reveal, SectionLabel, SplitText, Spotlight, TONE } from "./primitives";
import { STEPS, OUTCOME_FLOW } from "../content";

const ICONS = { Phone, MessageSquare, Calendar, Bot, ClipboardCheck };

/**
 * How It Works — alternating zig-zag on a scroll-drawn spine, so the eye
 * travels left/right down the page instead of scanning a flat row.
 *
 * The Outcome flow follows as a horizontal rail.
 */
export function HowItWorks() {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.55"] });
  const spine = useSpring(scrollYProgress, { stiffness: 90, damping: 28, restDelta: 0.001 });

  return (
    <section
      id="how-it-works"
      className="hv2-grain hv2-dots relative overflow-hidden border-y border-[var(--line)] bg-[var(--deep)] py-24 sm:py-28"
    >
      <div
        aria-hidden="true"
        className="hv2-aurora hv2-aurora-a pointer-events-none"
        style={{
          top: "-10%",
          left: "20%",
          width: "40rem",
          height: "40rem",
          background: "radial-gradient(circle, rgba(37,99,235,0.12), transparent 68%)",
        }}
      />

      <div className="relative mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="max-w-2xl">
          <SectionLabel index="02" eyebrow="How It Works" />
          <h2 className="hv2-display mt-7 text-[clamp(2rem,4.6vw,3.2rem)] text-[var(--text)]">
            <SplitText text="Three steps." />{" "}
            <span className="hv2-accent hv2-grad-text">Zero missed leads.</span>
          </h2>
        </div>

        {/* ---------- Zig-zag ---------- */}
        <div ref={ref} className="relative mt-16">
          <div
            aria-hidden="true"
            className="absolute left-[27px] top-0 hidden h-full w-px bg-[var(--line)] md:left-1/2 md:block md:-translate-x-1/2"
          >
            <motion.div
              className="h-full w-full origin-top bg-gradient-to-b from-[var(--brand-glow)] via-[var(--brand)] to-[var(--acid)]"
              style={reduce ? { scaleY: 1 } : { scaleY: spine }}
            />
          </div>

          <div className="space-y-10 md:space-y-16">
            {STEPS.map((s, i) => {
              const Icon = ICONS[s.icon];
              const last = i === STEPS.length - 1;
              const tone = last ? TONE.acid : TONE.brand;
              const left = i % 2 === 0;

              return (
                <div key={s.n} className="relative grid items-center gap-6 md:grid-cols-2 md:gap-16">
                  {/* Spine node */}
                  <motion.span
                    initial={reduce ? false : { scale: 0 }}
                    whileInView={reduce ? {} : { scale: 1 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className={[
                      "absolute left-[20px] top-8 z-10 hidden h-4 w-4 rounded-full ring-4 ring-[var(--mist)] md:left-1/2 md:block md:-translate-x-1/2",
                      tone.solid,
                    ].join(" ")}
                  />

                  <motion.div
                    initial={reduce ? false : { opacity: 0, x: left ? -40 : 40 }}
                    whileInView={reduce ? {} : { opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={["group", left ? "md:col-start-1" : "md:col-start-2 md:row-start-1"].join(" ")}
                  >
                    <Spotlight
                      tint={tone.rgb}
                      className="hv2-glass hv2-lift rounded-[1.75rem] p-8"
                    >
                      <span
                        aria-hidden="true"
                        className="hv2-display pointer-events-none absolute -right-2 -top-9 select-none text-[130px] leading-none text-[var(--ink)]/[0.05]"
                      >
                        {s.n}
                      </span>

                      <div className="relative mb-6 flex items-center gap-3.5">
                        <span
                          className={[
                            "flex h-11 w-11 items-center justify-center rounded-xl text-[15px] font-extrabold text-white transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[8deg]",
                            tone.solid,
                          ].join(" ")}
                        >
                          {s.n}
                        </span>
                        <span
                          className={[
                            "flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110",
                            tone.chip,
                          ].join(" ")}
                        >
                          <Icon className="h-5 w-5" strokeWidth={1.8} />
                        </span>
                      </div>

                      <h3 className="hv2-display relative text-[22px] text-[var(--text)]">
                        {s.title}
                      </h3>
                      <p className="relative mt-3 text-[16px] leading-[1.7] text-[var(--text-dim)]">
                        {s.body}
                      </p>
                    </Spotlight>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ---------- Outcome ---------- */}
        <div className="mt-24">
          <Reveal>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <SectionLabel eyebrow="The Outcome" />
                <h3 className="hv2-display mt-4 text-[clamp(1.5rem,3.4vw,2.2rem)] text-[var(--text)]">
                  From missed lead to <span className="hv2-accent text-[var(--acid)]">booked inspection</span>
                </h3>
              </div>
              <p className="max-w-sm text-[15.5px] leading-[1.65] text-[var(--text-dim)]">
                Roof AI turns a single inquiry into an inspection on your calendar —
                automatically.
              </p>
            </div>
          </Reveal>

          <div className="hv2-noscroll mt-10 -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            <div className="flex min-w-max items-stretch gap-3 sm:min-w-0 sm:gap-4">
              {OUTCOME_FLOW.map((f, i) => {
                const Icon = ICONS[f.icon];
                const tone = f.tone === "emerald" ? TONE.acid : TONE.brand;
                return (
                  <div key={f.label} className="flex items-center gap-3 sm:flex-1 sm:gap-4">
                    <motion.div
                      initial={reduce ? false : { opacity: 0, y: 26 }}
                      whileInView={reduce ? {} : { opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ delay: i * 0.12, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                      className="group w-[9.5rem] shrink-0 sm:w-auto sm:flex-1"
                    >
                      <Spotlight
                        tint={tone.rgb}
                        className="hv2-glass hv2-lift flex h-full flex-col items-center rounded-2xl px-5 py-7 text-center"
                      >
                        <span
                          className={[
                            "relative mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6",
                            tone.chip,
                          ].join(" ")}
                        >
                          <Icon className="h-6 w-6" strokeWidth={1.8} />
                        </span>
                        <p className="relative text-[14.5px] font-bold text-[var(--text)]">
                          {f.label}
                        </p>
                      </Spotlight>
                    </motion.div>

                    {i < OUTCOME_FLOW.length - 1 && (
                      <span className="flex shrink-0 items-center text-[var(--brand-glow)]" aria-hidden="true">
                        <svg width="30" height="12" viewBox="0 0 30 12" fill="none">
                          <line
                            x1="0"
                            y1="6"
                            x2="20"
                            y2="6"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="hv2-dash"
                            opacity="0.5"
                          />
                        </svg>
                        <ArrowRight className="-ml-2.5 h-4 w-4" strokeWidth={2.5} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
