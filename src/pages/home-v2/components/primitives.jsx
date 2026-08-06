import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
import { ArrowRight } from "lucide-react";

/**
 * "Aurora Noir" primitives.
 *
 * Motion is scroll-LINKED rather than scroll-triggered: elements track scroll
 * position continuously instead of only fading in once on entry.
 *
 * Page-local: src/components/ui/ primitives are cva-based with fixed radii and
 * light-mode fills, and are not modified by this route.
 */

const EASE = [0.16, 1, 0.3, 1];

/* =========================================================================
   Reveal
   ====================================================================== */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  x = 0,
  scale,
  blur = false,
  className = "",
  amount = 0.25,
}) {
  const reduce = useReducedMotion();

  const from = { opacity: 0, y, x };
  if (scale !== undefined) from.scale = scale;
  if (blur) from.filter = "blur(10px)";

  const to = { opacity: 1, y: 0, x: 0 };
  if (scale !== undefined) to.scale = 1;
  if (blur) to.filter = "blur(0px)";

  return (
    <motion.div
      className={className}
      initial={reduce ? false : from}
      whileInView={reduce ? {} : to}
      viewport={{ once: true, amount }}
      transition={{ delay, duration: 0.75, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* =========================================================================
   Parallax
   ====================================================================== */
export function Parallax({ children, speed = 60, className = "" }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);
  const smooth = useSpring(y, { stiffness: 90, damping: 26, restDelta: 0.5 });

  return (
    <motion.div ref={ref} className={className} style={reduce ? undefined : { y: smooth }}>
      {children}
    </motion.div>
  );
}

/* =========================================================================
   SplitText — per-character reveal with a 3D tilt. Headlines only.
   ====================================================================== */
export function SplitText({ text, className = "", delay = 0, stagger = 0.02 }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  let charIndex = -1;

  return (
    <span className={className} style={{ perspective: 900 }}>
      {words.map((word, w) => (
        <span key={`${word}-${w}`} className="inline-block whitespace-nowrap">
          {word.split("").map((ch, c) => {
            charIndex += 1;
            return (
              <motion.span
                key={`${ch}-${c}`}
                className="inline-block"
                initial={reduce ? false : { opacity: 0, y: "0.55em", rotateX: -60 }}
                whileInView={reduce ? {} : { opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{
                  delay: delay + charIndex * stagger,
                  duration: 0.6,
                  ease: EASE,
                }}
                style={{ transformOrigin: "50% 100%" }}
              >
                {ch}
              </motion.span>
            );
          })}
          {w < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

/* =========================================================================
   Magnetic
   ====================================================================== */
export function Magnetic({ children, strength = 0.26, className = "" }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onMove = (e) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({
      x: (e.clientX - (r.left + r.width / 2)) * strength,
      y: (e.clientY - (r.top + r.height / 2)) * strength,
    });
  };

  return (
    <motion.div
      ref={ref}
      className={["inline-block", className].join(" ")}
      onMouseMove={onMove}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 220, damping: 18, mass: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

/* =========================================================================
   Spotlight — pointer-tracking highlight. Self-contained hover state so it
   never depends on an ancestor carrying a `group` class.
   ====================================================================== */
export function Spotlight({ children, className = "", tint = "79, 139, 255" }) {
  const ref = useRef(null);
  const [p, setP] = useState({ x: -400, y: -400 });
  const [hot, setHot] = useState(false);
  const reduce = useReducedMotion();

  const onMove = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setP({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => {
        setHot(false);
        setP({ x: -400, y: -400 });
      }}
      className={["relative overflow-hidden", className].join(" ")}
    >
      {!reduce && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: hot ? 1 : 0,
            background: `radial-gradient(440px circle at ${p.x}px ${p.y}px, rgba(${tint},0.2), transparent 70%)`,
          }}
        />
      )}
      {children}
    </div>
  );
}

/* =========================================================================
   SectionLabel — index chip + rule + eyebrow.
   ====================================================================== */
export function SectionLabel({ index, eyebrow, className = "" }) {
  const reduce = useReducedMotion();

  return (
    <div className={["flex items-center gap-3.5", className].join(" ")}>
      {index && (
        <span className="hv2-mono flex h-7 items-center rounded-full border border-[var(--line)] bg-[var(--glass)] px-2.5 text-[11px] font-bold text-[var(--acid)]">
          {index}
        </span>
      )}
      <motion.span
        className="block h-px bg-gradient-to-r from-[var(--acid)] to-transparent"
        initial={reduce ? false : { width: 0 }}
        whileInView={reduce ? {} : { width: 40 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: EASE }}
        style={reduce ? { width: 40 } : undefined}
      />
      <span className="hv2-eyebrow text-[var(--text-dim)]">{eyebrow}</span>
    </div>
  );
}

/* =========================================================================
   CtaButton
     acid    — the primary action. Lime fill, black text, heavy glow.
     glass   — secondary. Translucent with a light edge.
     dark    — for use on the acid full-bleed band.
   ====================================================================== */
export function CtaButton({
  to = "/signup",
  children,
  variant = "acid",
  className = "",
  size = "lg",
  magnetic = true,
}) {
  const sizes = {
    lg: "px-7 py-4 text-[15px]",
    md: "px-5 py-2.5 text-[13.5px]",
  };

  const variants = {
    /* `acid` is the primary action. On the live palette that is brand blue
       with white text — the name is kept so callers don't churn. */
    acid: "hv2-glow-acid bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)]",
    glass:
      "border border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--brand-600)]/45 hover:shadow-[0_10px_28px_-14px_rgba(15,23,42,0.35)]",
    brand: "hv2-glow-brand bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)]",
    dark: "bg-[var(--ink)] text-white hover:bg-[var(--brand-700)]",
  };

  const btn = (
    <Link
      to={to}
      className={[
        "group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full font-bold tracking-[-0.01em] transition-all duration-300",
        sizes[size],
        variants[variant],
        className,
      ].join(" ")}
    >
      <span className="relative z-10 flex items-center gap-2.5">
        {children}
        <span className="relative h-4 w-4 overflow-hidden">
          <ArrowRight className="absolute inset-0 h-4 w-4 transition-transform duration-300 group-hover:translate-x-5" />
          <ArrowRight className="absolute inset-0 h-4 w-4 -translate-x-5 transition-transform duration-300 group-hover:translate-x-0" />
        </span>
      </span>
    </Link>
  );

  return magnetic ? <Magnetic>{btn}</Magnetic> : btn;
}

/* =========================================================================
   Counters
   ====================================================================== */
export function useCountUp(target, { start, duration = 1500, delay = 0 }) {
  const [value, setValue] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      setValue(target);
      return undefined;
    }
    if (!start) return undefined;

    let frame;
    const timer = setTimeout(() => {
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / duration, 1);
        setValue(Math.round(target * (1 - Math.pow(1 - p, 4))));
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timer);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [start, target, duration, delay, reduce]);

  return value;
}

export function CountUp({ to, prefix = "", suffix = "", duration = 1500, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const value = useCountUp(to, { start: inView, duration, delay });

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

/* =========================================================================
   Tone map
   ====================================================================== */
export const TONE = {
  brand: {
    chip: "bg-[var(--brand-50)] text-[var(--brand-600)]",
    text: "text-[var(--brand-600)]",
    solid: "bg-[var(--brand-600)]",
    rgb: "37, 99, 235",
  },
  /* `acid` maps to emerald on the live palette — the success/outcome colour. */
  acid: {
    chip: "bg-[var(--emerald-50)] text-[var(--emerald-600)]",
    text: "text-[var(--emerald-600)]",
    solid: "bg-[var(--emerald-500)]",
    rgb: "16, 185, 129",
  },
  emerald: {
    chip: "bg-[var(--emerald-50)] text-[var(--emerald-600)]",
    text: "text-[var(--emerald-600)]",
    solid: "bg-[var(--emerald-500)]",
    rgb: "16, 185, 129",
  },
  rose: {
    chip: "bg-[var(--red-50)] text-[var(--red-500)]",
    text: "text-[var(--red-700)]",
    solid: "bg-[var(--red-500)]",
    rgb: "239, 68, 68",
  },
  slate: {
    chip: "bg-[var(--mist)] text-[var(--muted)]",
    text: "text-[var(--muted)]",
    solid: "bg-[var(--muted)]",
    rgb: "100, 116, 139",
  },
};
