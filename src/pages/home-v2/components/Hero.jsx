import { useRef, useState, lazy, Suspense } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Play, Check } from "lucide-react";
import { CtaButton, SplitText, Magnetic } from "./primitives";
import { PhoneShowcase } from "./PhoneShowcase";
import { TRUST_BUILDERS } from "../content";

/* Lazily imported so the player — and framer's portal work — land in their own
   chunk that is only fetched when someone actually clicks "Watch demo". None
   of this is in the initial homepage bundle. */
const VideoModal = lazy(() =>
  import("./VideoModal").then((m) => ({ default: m.VideoModal }))
);

/* Warm the chunk on hover/focus so the modal opens instantly on click, while
   still costing nothing to visitors who never intend to watch. */
let demoChunkWarmed = false;
function warmDemoChunk() {
  if (demoChunkWarmed) return;
  demoChunkWarmed = true;
  import("./VideoModal");
}

/**
 * Hero — aurora over a receding perspective floor.
 *
 * LAYOUT CONTRACT (unchanged, and the reason the fold behaves): the section is
 * a flex column of 100svh minus the 72px sticky nav. The content row flexes to
 * fill; the trust marquee sits in normal flow at the bottom. Nothing is pinned
 * to the bottom edge, and .hv2-hero-title sizes on min(vw, vh) so a short
 * laptop shrinks the headline rather than pushing the CTA off-screen.
 *
 * TYPOGRAPHY: the signature gesture is the Instrument Serif italic set inside
 * the Bricolage Grotesque headline — one phrase in a different voice.
 *
 * The headline leads with the missed-call revenue problem so the product's
 * position is clear before the visitor reaches feature detail.
 */
export function Hero() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const [demoOpen, setDemoOpen] = useState(false);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const copyY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const phoneScale = useTransform(scrollYProgress, [0, 1], [1, 1.07]);

  const rise = (delay) =>
    reduce
      ? { initial: false, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.75, ease: [0.16, 1, 0.3, 1] },
        };

  return (
    <section
      ref={ref}
      className="hv2-grain relative flex min-h-[calc(100svh-72px)] flex-col overflow-hidden bg-[var(--void)]"
    >
      {/* ---------- Atmosphere ---------- */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="hv2-aurora hv2-aurora-a"
          style={{
            top: "-24%",
            right: "-6%",
            width: "44rem",
            height: "44rem",
            background: "radial-gradient(circle, rgba(37,99,235,0.16), transparent 66%)",
          }}
        />
        <div
          className="hv2-aurora hv2-aurora-b"
          style={{
            top: "12%",
            left: "-14%",
            width: "34rem",
            height: "34rem",
            background: "radial-gradient(circle, rgba(16,185,129,0.1), transparent 68%)",
          }}
        />
        <div
          className="hv2-aurora hv2-aurora-a"
          style={{
            bottom: "-16%",
            left: "34%",
            width: "30rem",
            height: "30rem",
            animationDelay: "-9s",
            background: "radial-gradient(circle, rgba(37,99,235,0.12), transparent 70%)",
          }}
        />
        <div className="hv2-floor" />
      </div>

      {/* ---------- Content row ---------- */}
      <div className="relative flex flex-1 items-center">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-8 sm:px-8 lg:py-10">
          <div className="grid items-center gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12">
            {/* ---------------- Copy ---------------- */}
            <motion.div style={reduce ? undefined : { y: copyY, opacity: copyOpacity }}>
              <motion.div {...rise(0)}>
                <span className="inline-flex items-center gap-2.5 rounded-full border border-[var(--line-2)] bg-[var(--glass)] px-3.5 py-1.5 text-[12px] font-bold text-[var(--text-dim)] backdrop-blur">
                  <span className="relative flex h-1.5 w-1.5 text-[var(--acid)]">
                    <span className="hv2-ping absolute inset-0 rounded-full" />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
                  </span>
                  Recovering Roofing Leads 24/7
                </span>
              </motion.div>

              <h1 className="hv2-display hv2-hero-title hv2-hero-gap text-[var(--text)]">
                <SplitText text="Recover More Roofing Opportunities From" delay={0.1} />{" "}
                <span className="hv2-accent hv2-grad-text relative inline-block pr-1">
                  Missed Calls
                </span>
              </h1>

              <motion.p
                {...rise(1.05)}
                className="hv2-hero-sub hv2-hero-gap max-w-xl leading-[1.65] text-[var(--text-dim)]"
              >
                Roof AI Lead Recovery helps roofing companies respond to missed and
                after-hours callers, qualify new opportunities and move homeowners toward
                an appointment—so more of the leads you already paid for get a chance to
                become revenue.
              </motion.p>

              <motion.div
                {...rise(1.14)}
                className="hv2-hero-gap flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <CtaButton
                  to="/what-happens-when-a-roofer-misses-a-homeowners-call/"
                  reloadDocument
                >
                  See How a Missed Call Gets Recovered
                </CtaButton>
                <Magnetic strength={0.2}>
                  <button
                    type="button"
                    onClick={() => setDemoOpen(true)}
                    onMouseEnter={warmDemoChunk}
                    onFocus={warmDemoChunk}
                    aria-haspopup="dialog"
                    className="group inline-flex items-center justify-center gap-3 rounded-full border border-[var(--line-2)] bg-[var(--glass)] px-6 py-3.5 text-[14.5px] font-bold text-[var(--text)] backdrop-blur transition-all duration-300 hover:border-[var(--brand-600)]/45 hover:bg-[var(--glass-2)]"
                  >
                    <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand)]/25 text-[var(--brand-glow)]">
                      <span className="hv2-ping absolute inset-0 rounded-full opacity-50" />
                      <Play className="relative h-2.5 w-2.5 fill-current" />
                    </span>
                    Watch 120-Second Demo Video
                  </button>
                </Magnetic>
              </motion.div>
            </motion.div>

            {/* ---------------- Phone ---------------- */}
            <motion.div
              style={reduce ? undefined : { y: phoneY, scale: phoneScale }}
              className="hidden lg:block"
            >
              <PhoneShowcase />
            </motion.div>

            <div className="lg:hidden">
              <PhoneShowcase />
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Trust marquee: in flow, cannot overlap ----------
          The track is width:max-content but its parent clips it, so this
          scrolls visually without widening the document. */}
      <div className="relative border-y border-[var(--line)] bg-[var(--deep)]/60 backdrop-blur">
        <div className="hv2-edge-fade overflow-hidden py-3.5">
          <div className="hv2-marquee-track" style={{ "--hv2-marquee-duration": "36s" }}>
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
                {TRUST_BUILDERS.map((t) => (
                  <span key={t} className="flex items-center gap-3 px-7">
                    <Check className="h-3.5 w-3.5 shrink-0 text-[var(--acid)]" strokeWidth={3.5} />
                    <span className="whitespace-nowrap text-[13.5px] font-bold text-[var(--text-dim)]">
                      {t}
                    </span>
                    <span className="ml-4 h-1 w-1 rotate-45 bg-[var(--acid)]/40" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Demo video ----------
          Mounted only while open, so no video bytes are requested until the
          visitor asks for them. Suspense covers the one-time chunk fetch. */}
      <AnimatePresence>
        {demoOpen && (
          <Suspense fallback={null}>
            <VideoModal key="demo" onClose={() => setDemoOpen(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </section>
  );
}
