import { Reveal, CtaButton, SplitText, Parallax } from "./primitives";

/**
 * The two closing CTAs from the live page, copy unchanged.
 *
 *   BottomCta — framed statement panel with parallax accents
 *   FinalCta  — full-bleed brand gradient band, matching the live page's own
 *               closing CTA ramp so both sites read as one brand.
 */

export function BottomCta() {
  return (
    <section className="hv2-grain relative overflow-hidden bg-[var(--void)] py-24 sm:py-28">
      <div className="relative mx-auto max-w-[1280px] px-5 sm:px-8">
        <Reveal scale={0.97}>
          <div className="hv2-frame relative overflow-hidden rounded-[2.25rem]">
            <div className="relative overflow-hidden rounded-[2.25rem] bg-[var(--surface)]/80 p-10 text-center backdrop-blur-xl sm:p-16">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <Parallax speed={26} className="absolute -left-16 top-4">
                  <div
                    className="h-56 w-56 rounded-full blur-3xl"
                    style={{
                      background: "radial-gradient(circle, rgba(37,99,235,0.16), transparent 70%)",
                    }}
                  />
                </Parallax>
                <Parallax speed={-30} className="absolute -right-14 bottom-0">
                  <div
                    className="h-48 w-48 rounded-full blur-3xl"
                    style={{
                      background: "radial-gradient(circle, rgba(16,185,129,0.14), transparent 70%)",
                    }}
                  />
                </Parallax>
              </div>

              <h2 className="hv2-display relative text-[clamp(1.9rem,5vw,3rem)] text-[var(--text)]">
                <SplitText text="Stop losing roofing jobs to" />{" "}
                <span className="hv2-accent hv2-grad-text">voicemail</span>
              </h2>
              <Reveal delay={0.2}>
                <p className="relative mx-auto mt-5 max-w-xl text-[17px] leading-[1.7] text-[var(--text-dim)]">
                  Every missed call is a homeowner looking for help. We'll respond within
                  seconds — so you book more inspections and recover more revenue.
                </p>
              </Reveal>
              <Reveal delay={0.28}>
                <div className="relative mt-9 flex justify-center">
                  <CtaButton>Start Your 7-Day Free Trial</CtaButton>
                </div>
                <p className="relative mt-5 text-[13.5px] text-[var(--text-faint)]">
                  No contracts · No setup fee · Cancel anytime
                </p>
              </Reveal>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function FinalCta() {
  // Brand gradient band — the same 135deg blue ramp the live page uses for its
  // closing CTA, so the two sites read as one brand.
  //
  // The sm+ bottom padding reserves the strip the ghost wordmark sits in. It
  // is a clamp rather than a fixed value so it tracks the wordmark's own vw
  // sizing — a fixed pad left a big dead gap on narrow screens and went tight
  // on wide ones. Mobile keeps the plain padding; the wordmark is hidden there.
  return (
    <section
      className="relative overflow-hidden pb-28 pt-28 sm:pb-[clamp(8rem,12vw,16rem)] sm:pt-36"
      style={{
        background:
          "radial-gradient(760px 420px at 22% 18%, rgba(96,165,250,0.4), transparent 60%), linear-gradient(135deg, #3b82f6 0%, #2563eb 52%, #1d4ed8 100%)",
      }}
    >
      {/* Oversized ghost wordmark, seated ON the bottom edge.

          The trick is translate-y-[0.22em]. With `bottom: 0` and leading-none
          the line box bottom meets the section edge, but the BASELINE sits a
          descender's depth above it — which is the gap that made this look like
          it was floating. Nudging down by that depth lands the baseline exactly
          on the edge, so the caps rest on the boundary.

          Overshooting is safe here: "ROOF AI LEAD RECOVERY" is all caps with no
          descenders, so the only thing pushed below the edge is empty space. */}
      <span
        aria-hidden="true"
        className="hv2-display pointer-events-none absolute bottom-0 left-1/2 hidden w-full -translate-x-1/2 translate-y-[0.22em] select-none whitespace-nowrap text-center text-[min(10.5vw,15rem)] leading-none text-white/[0.11] sm:block"
      >
        ROOF AI LEAD RECOVERY
      </span>

      <div className="relative z-10 mx-auto max-w-[1280px] px-5 text-center sm:px-8">
        <span className="inline-flex items-center gap-2.5 rounded-full border border-white/35 bg-white/15 px-4 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.14em] text-white">
          Last call
        </span>

        <h2 className="hv2-display mx-auto mt-7 max-w-4xl text-[clamp(2.2rem,6.5vw,4.2rem)] text-white">
          <SplitText text="Stop losing roofing jobs to" />{" "}
          <span className="hv2-accent">voicemail</span>
        </h2>

        <Reveal delay={0.25}>
          <p className="mx-auto mt-6 max-w-2xl text-[17.5px] font-medium leading-[1.7] text-white/85">
            Every missed call is a homeowner looking for help. We'll respond within seconds.
            Book more inspections. Recover more revenue.
          </p>
        </Reveal>
        <Reveal delay={0.33}>
          <div className="mt-10 flex justify-center">
            <CtaButton variant="glass">Start Your 7-Day Free Trial</CtaButton>
          </div>
        </Reveal>
        <Reveal delay={0.4}>
          <p className="mt-5 text-[13.5px] font-semibold text-white/65">
            No contracts · No setup fee · Cancel anytime
          </p>
        </Reveal>
      </div>
    </section>
  );
}
