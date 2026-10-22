import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Check } from "lucide-react";
import { CtaButton } from "./primitives";
import { PhoneShowcase } from "./PhoneShowcase";
import { TRUST_BUILDERS } from "../content";

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

              <h1 className="hv2-display hv2-hero-title hv2-hero-gap text-[var(--text)]">The call you miss is the job that goes to whoever answers.</h1>

              <motion.p
                {...rise(1.05)}
                className="hv2-hero-sub hv2-hero-gap max-w-xl leading-[1.65] text-[var(--text-dim)]"
              >
                A homeowner with a leaking roof doesn't leave a voicemail and wait. They call the next roofer on the list. Roof AI Lead Recovery answers the calls your team can't get to — missed calls and after-hours calls — qualifies the caller, and hands your team a clear next step, so the leads you already paid for stop slipping away.
              </motion.p>

              <motion.div
                {...rise(1.14)}
                className="hv2-hero-gap flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <CtaButton
                  to="/resources/roofing-missed-call-scorecard/#call-review"
                  reloadDocument
                >
                  Get My Free Missed-Call Audit
                </CtaButton>
                <a href="/signup" className="text-sm font-bold underline text-[var(--text)]">or start the free 30-day pilot</a>
              </motion.div>
              <p className="mt-3 text-sm text-[var(--text-dim)]">For roofing companies. Keep your current number — your staff still answers first. We only catch the overflow.</p><p className="mt-3 text-sm text-[var(--text-dim)]">No setup fee · No contract · Cancel anytime · Free 30-day pilot — see exactly what it catches before you pay a dollar</p>
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


    </section>
  );
}
