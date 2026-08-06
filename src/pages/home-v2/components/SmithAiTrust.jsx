import { Parallax, Reveal, SectionLabel, Spotlight } from "./primitives";
import { SMITH_AI_POINTS } from "../content";

/**
 * Smith.ai credibility. Copy verbatim.
 *
 * Off-axis split — the mark parallaxes against the statement — so it breaks
 * the rhythm of the sections either side of it.
 */
export function SmithAiTrust() {
  return (
    <section className="hv2-grain relative overflow-hidden bg-[var(--void)] py-24 sm:py-28">
      <div className="relative mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          {/* Mark */}
          <Parallax speed={34} className="order-2 lg:order-1">
            <div className="relative mx-auto flex aspect-square w-full max-w-[19rem] items-center justify-center">
              <div
                aria-hidden="true"
                className="hv2-aurora hv2-aurora-a absolute inset-0"
                style={{
                  background: "radial-gradient(circle, rgba(37,99,235,0.4), transparent 66%)",
                }}
              />
              <div className="hv2-glass relative flex h-full w-full items-center justify-center rounded-[2.5rem]">
                <span className="text-[7rem] leading-none">🤝</span>
                <span className="hv2-float hv2-glass absolute -right-4 top-8 rounded-2xl px-4 py-2.5 text-[13px] font-bold text-[var(--text)]">
                  Live receptionist
                </span>
                <span className="hv2-float-slow hv2-glass absolute -left-4 bottom-10 rounded-2xl px-4 py-2.5 text-[13px] font-bold text-[var(--acid)]">
                  Never voicemail
                </span>
              </div>
            </div>
          </Parallax>

          {/* Statement */}
          <div className="order-1 lg:order-2">
            <Reveal>
              <SectionLabel index="07" eyebrow="Trusted Call Handling" />
              <h3 className="hv2-display mt-7 text-[clamp(1.8rem,4.2vw,2.7rem)] text-[var(--text)]">
                Live receptionist support powered by{" "}
                <span className="hv2-accent hv2-grad-text">Smith.ai</span>
              </h3>
              <p className="mt-6 max-w-xl text-[17px] leading-[1.75] text-[var(--text-dim)]">
                When AI needs a human, your customers speak with a{" "}
                <span className="font-bold text-[var(--text)]">trained live receptionist</span> —
                not voicemail. Smith.ai handles overflow calls so every homeowner gets a real
                response, every single time.
              </p>
            </Reveal>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {SMITH_AI_POINTS.map((item, i) => (
                <Reveal key={item.text} delay={i * 0.1}>
                  <div className="group h-full">
                    <Spotlight className="hv2-glass hv2-lift h-full rounded-2xl p-5">
                      <span className="relative mb-3 block text-2xl transition-transform duration-500 group-hover:scale-125">
                        {item.emoji}
                      </span>
                      <p className="relative text-[14px] leading-[1.6] text-[var(--text-dim)]">
                        {item.text}
                      </p>
                    </Spotlight>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
