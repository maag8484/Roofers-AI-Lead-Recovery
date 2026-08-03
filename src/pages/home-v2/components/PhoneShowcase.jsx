import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Phone, CheckCircle2, Calendar, Home } from "lucide-react";

/**
 * Hero device.
 *
 * CHIP PLACEMENT: chips are anchored to the OUTER wrapper, which carries side
 * padding so they sit beside the handset rather than over its screen. Hidden
 * below sm, where there is no room beside the device.
 *
 * The shared PhoneMockup.jsx is untouched.
 */

const THREAD = [
  { side: "left", text: "Missed call from (214) 555-0142" },
  {
    side: "right",
    text: "Hi! This is Apex Roofing. Sorry we missed you — are you looking for a roof repair or a full replacement?",
    typing: true,
  },
  { side: "left", text: "Repair — got a leak after the storm" },
  {
    side: "right",
    text: "Got it. I can get you a free inspection. Does tomorrow at 2:00 PM work?",
    typing: true,
  },
];

function Typing() {
  return (
    <div className="flex w-14 items-center justify-center gap-1 rounded-2xl rounded-br-md bg-[var(--brand)] px-3 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="hv2-dot h-1.5 w-1.5 rounded-full bg-white"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </div>
  );
}

function Chip({ icon: Icon, accent, label, value, className, float, delay, reduce }) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={["absolute z-30 hidden sm:block", float, className].join(" ")}
    >
      <div className="hv2-glass flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5">
        <span
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            accent === "acid"
              ? "bg-[var(--acid)]/15 text-[var(--acid)]"
              : "bg-[var(--brand)]/25 text-[var(--brand-glow)]",
          ].join(" ")}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="whitespace-nowrap text-xs leading-tight">
          <span className="block font-medium text-[var(--text-faint)]">{label}</span>
          <span
            className={[
              "block font-extrabold",
              accent === "acid" ? "text-[var(--acid)]" : "text-[var(--text)]",
            ].join(" ")}
          >
            {value}
          </span>
        </span>
      </div>
    </motion.div>
  );
}

export function PhoneShowcase() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(reduce ? THREAD.length + 1 : 0);

  useEffect(() => {
    if (reduce) return undefined;
    if (step > THREAD.length) return undefined;
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 700 : 1250);
    return () => clearTimeout(t);
  }, [step, reduce]);

  const booked = step > THREAD.length;

  return (
    <div className="relative mx-auto w-full max-w-[430px] px-0 sm:px-10">
      {/* Device bloom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-14%] rounded-full opacity-80 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(37,99,235,0.12), rgba(16,185,129,0.08) 55%, transparent 70%)",
        }}
      />

      <Chip
        icon={Phone}
        accent="acid"
        label="New lead recovered"
        value="+$12,000 job"
        className="right-0 top-10"
        float="hv2-float"
        delay={1.15}
        reduce={reduce}
      />
      <Chip
        icon={Calendar}
        accent="brand"
        label="Responded in"
        value="18 seconds"
        className="bottom-14 left-0"
        float="hv2-float-slow"
        delay={1.45}
        reduce={reduce}
      />

      {/* Handset */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="relative mx-auto w-full max-w-[330px] overflow-hidden rounded-[2.4rem] border-[7px] border-[var(--ink-900)] bg-white shadow-[0_50px_90px_-40px_rgba(15,23,42,0.55)]"
      >
        {/* Header */}
        <div className="hv2-beam relative flex items-center gap-3 overflow-hidden border-b border-[var(--line)] bg-gradient-to-r from-[var(--brand-deep)] via-[var(--brand)] to-[var(--brand-bright)] px-4 py-3.5 text-white">
          {/* Same Home glyph the real logo uses, on the brand header. */}
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <Home className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight">Roof AI Lead Recovery</p>
            <p className="flex items-center gap-1.5 text-xs text-white/85">
              <span className="relative flex h-1.5 w-1.5 text-[var(--acid)]">
                <span className="hv2-ping absolute inset-0 rounded-full" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
              </span>
              Auto-replying now
            </p>
          </div>
        </div>

        {/* Conversation */}
        <div className="min-h-[318px] space-y-3 px-3.5 py-4">
          {THREAD.map((m, i) => {
            if (i > step) return null;

            if (i === step && m.typing) {
              return (
                <div key={`typing-${i}`} className="flex justify-end">
                  <Typing />
                </div>
              );
            }
            if (i === step && !m.typing) return null;

            return (
              <motion.div
                key={m.text}
                initial={reduce ? false : { opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                className={m.side === "right" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={[
                    "max-w-[80%] px-3.5 py-2.5 text-[13px] leading-snug",
                    m.side === "right"
                      ? "rounded-2xl rounded-br-md bg-[var(--brand)] text-white shadow-[0_10px_24px_-12px_rgba(37,99,235,1)]"
                      : "rounded-2xl rounded-bl-md border border-[var(--line)] bg-[var(--mist)] text-[var(--text)]",
                  ].join(" ")}
                >
                  {m.text}
                </div>
              </motion.div>
            );
          })}

          {booked && (
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--acid)]/30 bg-[var(--acid)]/10 px-3 py-2.5 text-[12px] font-bold text-[var(--acid)]"
            >
              <CheckCircle2 className="h-4 w-4" />
              Inspection booked · Tue 2:00 PM
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
