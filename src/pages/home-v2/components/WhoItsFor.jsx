import { Check } from "lucide-react";
import { Reveal, SectionLabel, SplitText } from "./primitives";
import { WHO_ITS_FOR } from "../content";

/**
 * Who It's For — two counter-scrolling marquee rows.
 *
 * Five short qualifying phrases as a static grid was the page's flattest
 * moment; opposed motion turns it into a texture band. Rows pause on hover so
 * anything can still be read.
 */
export function WhoItsFor() {
  const rowA = [...WHO_ITS_FOR, ...WHO_ITS_FOR];
  const rowB = [...WHO_ITS_FOR.slice().reverse(), ...WHO_ITS_FOR.slice().reverse()];

  const Pill = ({ label, acid }) => (
    <span
      className={[
        "hv2-glass mx-2 flex shrink-0 items-center gap-3 rounded-full px-6 py-4 transition-colors duration-300",
        acid ? "hover:border-[var(--acid)]/40" : "hover:border-[var(--brand-glow)]/40",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          acid ? "bg-[var(--acid)]/15 text-[var(--acid)]" : "bg-[var(--brand)]/25 text-[var(--brand-glow)]",
        ].join(" ")}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
      </span>
      <span className="whitespace-nowrap text-[15.5px] font-bold text-[var(--text)]">
        {label}
      </span>
    </span>
  );

  return (
    <section className="hv2-grain relative overflow-hidden bg-[var(--void)] py-24 sm:py-28">
      <div
        aria-hidden="true"
        className="hv2-aurora hv2-aurora-b pointer-events-none"
        style={{
          top: "10%",
          left: "40%",
          width: "32rem",
          height: "32rem",
          background: "radial-gradient(circle, rgba(16,185,129,0.12), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal className="flex justify-center">
            <SectionLabel index="03" eyebrow="Who It's For" />
          </Reveal>
          <h2 className="hv2-display mt-7 text-[clamp(2rem,4.6vw,3.1rem)] text-[var(--text)]">
            <SplitText text="Perfect for roofing" />{" "}
            <span className="hv2-accent hv2-grad-text">companies that:</span>
          </h2>
          <Reveal delay={0.15}>
            <p className="mx-auto mt-5 max-w-lg text-[17px] leading-[1.65] text-[var(--text-dim)]">
              If any of these sound like you, Roof AI will pay for itself fast.
            </p>
          </Reveal>
        </div>
      </div>

      <div className="hv2-edge-fade relative mt-14 space-y-4">
        <div className="overflow-hidden">
          <div className="hv2-marquee-track" style={{ "--hv2-marquee-duration": "44s" }}>
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0" aria-hidden={dup === 1}>
                {rowA.map((w, i) => (
                  <Pill key={`${w}-${i}`} label={w} acid={i % 2 === 0} />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden">
          <div
            className="hv2-marquee-track hv2-marquee-rev"
            style={{ "--hv2-marquee-duration": "54s" }}
          >
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0" aria-hidden={dup === 1}>
                {rowB.map((w, i) => (
                  <Pill key={`${w}-${i}`} label={w} acid={i % 2 === 1} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
