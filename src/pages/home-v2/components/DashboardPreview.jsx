import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Users, Phone, Calendar, Clock, ArrowRight, TrendingUp } from "lucide-react";
import { Reveal, SectionLabel, SplitText, CountUp, Spotlight, TONE } from "./primitives";
import { DASH_STATS } from "../content";

const ICONS = { Users, Phone, Calendar, Clock };

/* Deterministic — no Math.random, so renders are stable. */
const SPARKS = [
  "M0 26 L14 21 L28 23 L42 14 L56 16 L70 7 L84 3",
  "M0 24 L14 25 L28 17 L42 19 L56 11 L70 12 L84 5",
  "M0 28 L14 22 L28 24 L42 15 L56 12 L70 9 L84 4",
  "M0 20 L14 23 L28 15 L42 17 L56 10 L70 11 L84 6",
];

/**
 * Dashboard preview — bento grid inside a 3D-tilted frame that un-tilts as it
 * enters, selling it as a screen rather than a diagram. The first tile spans
 * two columns so the grid has a focal point.
 */
export function DashboardPreview() {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "start 0.25"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [14, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.93, 1]);

  return (
    <section className="hv2-grain relative overflow-hidden border-y border-[var(--line)] bg-[var(--deep)] py-24 sm:py-28">
      <div
        aria-hidden="true"
        className="hv2-aurora hv2-aurora-a pointer-events-none"
        style={{
          top: "-14%",
          right: "10%",
          width: "42rem",
          height: "42rem",
          background: "radial-gradient(circle, rgba(37,99,235,0.13), transparent 66%)",
        }}
      />

      <div className="relative mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <SectionLabel index="04" eyebrow="Your Dashboard" />
            <h2 className="hv2-display mt-7 text-[clamp(2rem,4.6vw,3.1rem)] text-[var(--text)]">
              <SplitText text="What you'll see in" />{" "}
              <span className="hv2-accent hv2-grad-text">your dashboard</span>
            </h2>
          </div>
          <Reveal delay={0.1}>
            <p className="max-w-sm text-[16px] leading-[1.7] text-[var(--text-dim)]">
              Every recovered lead, response, and booking — tracked in one clean view.
            </p>
          </Reveal>
        </div>

        <div ref={ref} className="mt-14" style={{ perspective: "1500px" }}>
          <motion.div
            style={reduce ? undefined : { rotateX, scale, transformOrigin: "50% 0%" }}
            className="hv2-glass overflow-hidden rounded-[1.75rem]"
          >
            {/* Chrome */}
            <div className="flex items-center gap-2 border-b border-[var(--line)] px-5 py-3.5">
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--rose)]/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--acid)]/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--emerald)]/70" />
              </span>
              <span className="ml-3 flex items-center gap-2 text-[12.5px] font-semibold text-[var(--text-faint)]">
                <span className="relative flex h-1.5 w-1.5 text-[var(--acid)]">
                  <span className="hv2-ping absolute inset-0 rounded-full" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
                </span>
                Live · updating in real time
              </span>
            </div>

            {/* Bento */}
            <div className="grid grid-cols-2 gap-px bg-[var(--line)] lg:grid-cols-4">
              {DASH_STATS.map((s, i) => {
                const Icon = ICONS[s.icon];
                const tone = s.tone === "emerald" ? TONE.acid : TONE.brand;
                /* Bento spans must total a whole number of rows or the grid
                   leaves a hole. With 4 tiles in 4 columns:
                     row 1 = tile0 (2) + tile1 (1) + tile2 (1) = 4
                     row 2 = tile3 (4, full width)
                   Previously tile3 was 1 column wide, which left 3 empty
                   columns beside it. On the 2-column mobile grid the same
                   spans resolve to full / half+half / full — also gapless. */
                const wide = i === 0;
                const full = i === DASH_STATS.length - 1;
                const big = wide || full;
                return (
                  <motion.div
                    key={s.label}
                    initial={reduce ? false : { opacity: 0, y: 22 }}
                    whileInView={reduce ? {} : { opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ delay: i * 0.09, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                    className={[
                      "group relative",
                      wide ? "col-span-2" : full ? "col-span-2 lg:col-span-4" : "col-span-1",
                    ].join(" ")}
                  >
                    <Spotlight
                      tint={tone.rgb}
                      className="h-full bg-[var(--deep)] p-7 transition-colors duration-500 hover:bg-[var(--surface)]"
                    >
                      <div className="relative flex items-start justify-between">
                        <span
                          className={[
                            "flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6",
                            tone.chip,
                          ].join(" ")}
                        >
                          <Icon className="h-5 w-5" strokeWidth={1.8} />
                        </span>

                        {big && (
                          <span className="hv2-sticker flex items-center gap-1.5 rounded-full bg-[var(--emerald-50)] px-2.5 py-1 text-[11.5px] font-bold text-[var(--emerald-600)]">
                            <TrendingUp className="h-3 w-3" />
                            {wide ? "This month" : "Fastest yet"}
                          </span>
                        )}
                      </div>

                      <p
                        className={[
                          "hv2-display hv2-mono relative mt-6",
                          big ? "text-[clamp(2.6rem,6vw,3.7rem)]" : "text-[clamp(2rem,4.6vw,2.6rem)]",
                          s.tone === "emerald" ? "text-[var(--acid)]" : "text-[var(--text)]",
                        ].join(" ")}
                      >
                        <CountUp to={s.value} suffix={s.suffix} duration={1500} delay={i * 100} />
                      </p>
                      <p className="relative mt-1.5 text-[14.5px] text-[var(--text-dim)]">
                        {s.label}
                      </p>

                      <svg
                        viewBox="0 0 84 30"
                        preserveAspectRatio="none"
                        className={["relative mt-5 w-full", big ? "h-12" : "h-8"].join(" ")}
                        aria-hidden="true"
                      >
                        <motion.path
                          d={SPARKS[i]}
                          fill="none"
                          stroke={s.tone === "emerald" ? "var(--acid)" : "var(--brand-glow)"}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                          whileInView={reduce ? {} : { pathLength: 1, opacity: 0.9 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + i * 0.12, duration: 1.1, ease: "easeOut" }}
                        />
                      </svg>
                    </Spotlight>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <Reveal delay={0.15}>
          <div className="mt-10 text-center">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 rounded-full border border-[var(--line-2)] bg-[var(--glass)] px-6 py-3 text-[15px] font-bold text-[var(--text)] backdrop-blur transition-colors duration-300 hover:border-[var(--acid)]/50 hover:text-[var(--acid)]"
            >
              See the full dashboard
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
