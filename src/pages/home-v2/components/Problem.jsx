import { useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useMotionValueEvent } from "framer-motion";
import { Phone, PhoneOff, Bell } from "lucide-react";
import { SectionLabel, SplitText } from "./primitives";
import { PROBLEMS } from "../content";

const ICONS = { Phone, PhoneOff, Bell };

/* Escalation: neutral → alarm → loss. */
const TONES = [
  { fg: "var(--brand-600)", bg: "var(--brand-50)", glow: "rgba(37,99,235,0.12)" },
  { fg: "var(--red-500)", bg: "var(--red-50)", glow: "rgba(239,68,68,0.28)" },
  { fg: "var(--muted)", bg: "var(--mist)", glow: "rgba(100,116,139,0.22)" },
];

/**
 * The Problem — a PINNED scroll sequence.
 *
 * The framing sticks while the three beats advance on scroll. Mobile falls
 * back to a stack; pinning a small viewport traps the reader.
 */
export function Problem() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const i = Math.min(PROBLEMS.length - 1, Math.max(0, Math.floor(v * PROBLEMS.length)));
    setActive(i);
  });

  // This section must NOT carry overflow-hidden: it contains a `position:
  // sticky` child, and a clipped ancestor stops sticky from pinning to the
  // viewport — which turned this whole 300vh block into blank page. The aurora
  // is clipped by its own .hv2-clip wrapper instead.
  return (
    <section className="relative bg-[var(--void)]">
      <div aria-hidden="true" className="hv2-clip">
        <div
          className="hv2-aurora hv2-aurora-b"
          style={{
            top: "18%",
            right: "-10%",
            width: "34rem",
            height: "34rem",
            background: "radial-gradient(circle, rgba(239,68,68,0.12), transparent 68%)",
          }}
        />
      </div>

      {/* ============ Desktop: pinned ============ */}
      <div ref={ref} className="relative hidden lg:block" style={{ height: "300vh" }}>
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div className="mx-auto grid w-full max-w-[1280px] grid-cols-2 items-center gap-16 px-8">
            {/* Framing */}
            <div>
              <SectionLabel index="01" eyebrow="The Problem" />
              <h2 className="hv2-display mt-7 text-[clamp(2.2rem,4vw,3.3rem)] text-[var(--text)]">
                <SplitText text="Every missed call" />
                <br />
                <span className="hv2-accent text-[var(--rose)]">costs money</span>
              </h2>
              <p className="mt-6 max-w-md text-[17px] leading-[1.7] text-[var(--text-dim)]">
                When a homeowner reaches voicemail, they don't wait around. They dial the next
                roofer on the list.
              </p>

              <div className="mt-12">
                {PROBLEMS.map((p, i) => (
                  <button
                    key={p.title}
                    type="button"
                    onClick={() => {
                      const el = ref.current;
                      if (!el) return;
                      const band = el.offsetHeight / PROBLEMS.length;
                      window.scrollTo({
                        top: el.offsetTop + band * i + band * 0.5,
                        behavior: "smooth",
                      });
                    }}
                    className="group flex w-full items-center gap-5 border-t border-[var(--line)] py-4 text-left last:border-b"
                  >
                    <span
                      className="hv2-mono text-[11px] font-bold transition-colors duration-500"
                      style={{ color: i <= active ? TONES[i].fg : "var(--text-faint)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={[
                        "text-[15px] font-bold transition-colors duration-500",
                        i === active ? "text-[var(--text)]" : "text-[var(--text-faint)]",
                      ].join(" ")}
                    >
                      {p.title}
                    </span>
                    <span className="ml-auto h-px w-12 overflow-hidden bg-[var(--line)]">
                      <motion.span
                        className="block h-full origin-left"
                        style={{ background: TONES[i].fg }}
                        animate={{ scaleX: i <= active ? 1 : 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Advancing panel */}
            <div className="relative h-[380px]">
              {PROBLEMS.map((p, i) => {
                const Icon = ICONS[p.icon];
                const t = TONES[i];
                const on = i === active;
                return (
                  <motion.div
                    key={p.title}
                    className="absolute inset-0"
                    initial={false}
                    animate={{
                      opacity: on ? 1 : 0,
                      y: on ? 0 : i < active ? -36 : 36,
                      scale: on ? 1 : 0.96,
                      pointerEvents: on ? "auto" : "none",
                    }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div
                      className="hv2-glass relative flex h-full flex-col justify-center overflow-hidden rounded-[2rem] p-12"
                      style={{ boxShadow: `0 0 80px -36px ${t.glow}, 0 30px 66px -38px rgba(15,23,42,0.35)` }}
                    >
                      <span
                        aria-hidden="true"
                        className="hv2-display pointer-events-none absolute -right-4 -top-12 select-none text-[200px] leading-none text-[var(--ink)]/[0.045]"
                      >
                        {i + 1}
                      </span>
                      <span
                        className="relative mb-8 flex h-16 w-16 items-center justify-center rounded-2xl"
                        style={{ background: t.bg, color: t.fg }}
                      >
                        <Icon className="h-7 w-7" strokeWidth={1.8} />
                      </span>
                      <h3 className="hv2-display relative text-[28px] text-[var(--text)]">
                        {p.title}
                      </h3>
                      <p className="relative mt-4 max-w-sm text-[17px] leading-[1.7] text-[var(--text-dim)]">
                        {p.body}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ============ Mobile: stack ============ */}
      <div className="relative px-5 py-20 lg:hidden">
        <SectionLabel index="01" eyebrow="The Problem" />
        <h2 className="hv2-display mt-6 text-[clamp(2rem,8vw,2.6rem)] text-[var(--text)]">
          Every missed call <span className="hv2-accent text-[var(--rose)]">costs money</span>
        </h2>
        <p className="mt-5 text-[16px] leading-[1.7] text-[var(--text-dim)]">
          When a homeowner reaches voicemail, they don't wait around. They dial the next roofer
          on the list.
        </p>

        <div className="mt-10 space-y-4">
          {PROBLEMS.map((p, i) => {
            const Icon = ICONS[p.icon];
            const t = TONES[i];
            return (
              <motion.div
                key={p.title}
                initial={reduce ? false : { opacity: 0, y: 22 }}
                whileInView={reduce ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="hv2-glass relative overflow-hidden rounded-3xl p-6"
              >
                <span
                  aria-hidden="true"
                  className="hv2-display pointer-events-none absolute -right-1 -top-5 select-none text-[86px] leading-none text-[var(--ink)]/[0.05]"
                >
                  {i + 1}
                </span>
                <span
                  className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: t.bg, color: t.fg }}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <h3 className="hv2-display relative text-[20px] text-[var(--text)]">{p.title}</h3>
                <p className="relative mt-2.5 text-[15.5px] leading-[1.65] text-[var(--text-dim)]">
                  {p.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
