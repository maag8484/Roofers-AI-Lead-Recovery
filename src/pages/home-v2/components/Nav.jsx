import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { useResumePath } from "@/lib/useResumePath";
import { CtaButton } from "./primitives";

/**
 * Page-local nav — floating glass pill.
 *
 * Detaches from the top edge on scroll and contracts into a rounded capsule,
 * which keeps it feeling like an object over the aurora rather than a bar
 * welded to the viewport. The shared Navbar.jsx / Logo.jsx are NOT modified.
 */

const LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

/* The real brand mark — the shared <Logo/> the live homepage uses, imported
   rather than re-drawn so the two sites can never drift apart. It renders the
   full name "Roof AI Lead Recovery". The component itself is NOT modified. */

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 150, damping: 28, restDelta: 0.001 });

  // Session-aware actions. A signed-in visitor landing back on the homepage must
  // never be shown "Login / Start free trial" — they get a single button that
  // resumes wherever they actually left off (checkout → onboarding → dashboard,
  // or the console for admins). Mirrors marketing/Navbar.jsx.
  const { user, isAdmin, loading } = useAuth();
  const { path: resumePath, ready } = useResumePath();

  let resumeLabel = "Continue setup";
  if (isAdmin) resumeLabel = "Admin";
  else if (resumePath === "/dashboard") resumeLabel = "Go to dashboard";

  // Hold the actions back until both auth and the subscription lookup settle, so
  // the pill never flashes "Login" at a signed-in user or the wrong destination.
  const authResolved = !loading && ready;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 h-[72px]">
      <motion.div
        className="absolute inset-x-0 top-0 h-px origin-left bg-gradient-to-r from-[var(--brand-glow)] via-[var(--acid)] to-transparent"
        style={{ scaleX: progress }}
        aria-hidden="true"
      />

      <div
        className={[
          "mx-auto flex items-center justify-between transition-all duration-500",
          scrolled
            ? "mt-2.5 max-w-[1080px] rounded-full border border-[var(--line)] bg-[var(--deep)]/80 px-4 py-2.5 shadow-[0_20px_50px_-24px_rgba(0,0,0,1)] backdrop-blur-2xl sm:px-5"
            : "mt-0 max-w-[1280px] border border-transparent px-5 py-4 sm:px-8",
        ].join(" ")}
      >
        <Link to="/" aria-label="Roof AI Lead Recovery">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="rounded-full px-4 py-2 text-[14px] font-semibold text-[var(--text-dim)] transition-colors duration-300 hover:bg-[var(--mist)] hover:text-[var(--text)]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden min-h-[38px] items-center gap-3 lg:flex">
          {!authResolved ? null : user ? (
            <CtaButton to={resumePath} size="md" magnetic={false}>
              {resumeLabel}
            </CtaButton>
          ) : (
            <>
              <Link
                to="/login"
                className="text-[14px] font-semibold text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
              >
                Login
              </Link>
              <CtaButton size="md" magnetic={false}>
                Start free trial
              </CtaButton>
            </>
          )}
        </div>

        <button
          type="button"
          className="text-[var(--text)] lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="mx-4 mt-2 overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--deep)]/95 p-3 backdrop-blur-2xl lg:hidden"
          >
            {LINKS.map((l, i) => (
              <motion.a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.05 }}
                className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-[var(--text-dim)] hover:bg-[var(--mist)]"
              >
                {l.label}
                <span className="hv2-mono text-[11px] text-[var(--text-faint)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </motion.a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-[var(--line)] pt-3">
              {!authResolved ? null : user ? (
                <Link
                  to={resumePath}
                  onClick={() => setOpen(false)}
                  className="hv2-glow-acid flex items-center justify-center gap-2.5 rounded-full bg-[var(--brand-600)] py-3 text-center text-[14px] font-bold text-white transition-colors hover:bg-[var(--brand-700)]"
                >
                  {resumeLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-[var(--line-2)] py-3 text-center text-[14px] font-bold text-[var(--text)]"
                  >
                    Login
                  </Link>
                  <CtaButton className="w-full" magnetic={false}>
                    Start free trial
                  </CtaButton>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
