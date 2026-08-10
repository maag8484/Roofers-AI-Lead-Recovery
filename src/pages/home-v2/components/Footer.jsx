import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

/**
 * Page-local footer — multi-column sitemap on the void canvas. The shared
 * Footer.jsx / Logo.jsx are NOT modified.
 */

const COLS = [
  {
    label: "Product",
    links: [
      { text: "How it works", href: "#how-it-works" },
      { text: "Pricing", href: "#pricing" },
      { text: "FAQ", href: "#faq" },
    ],
  },
  {
    label: "Legal",
    links: [
      { text: "Privacy Policy", to: "/privacy" },
      { text: "Terms of Service", to: "/terms" },
    ],
  },
  {
    label: "Account",
    links: [
      { text: "Login", to: "/login" },
      { text: "Start free trial", to: "/signup" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="hv2-grain relative overflow-hidden bg-[var(--void)]">
      <div className="relative z-10 mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="grid gap-12 py-16 lg:grid-cols-12">
          {/* Identity */}
          <div className="lg:col-span-5">
            {/* Same shared <Logo/> the live homepage uses. */}
            <Logo />

            <p className="mt-6 max-w-xs text-[15px] leading-[1.75] text-[var(--text-dim)]">
              Instant response to missed calls, web leads and after-hours inquiries — so
              roofing companies book more estimates.
            </p>

            <div className="mt-7 flex flex-col gap-2">
              <a
                href="mailto:support@roofaileadrecovery.com"
                className="text-[14.5px] font-bold text-[var(--acid)] transition-opacity hover:opacity-75"
              >
                support@roofaileadrecovery.com
              </a>
              <a
                href="tel:+18149362291"
                className="text-[14.5px] font-bold text-[var(--acid)] transition-opacity hover:opacity-75"
              >
                (814) 936-2291
              </a>
            </div>
          </div>

          {/* Sitemap */}
          {COLS.map((col) => (
            <div key={col.label} className="lg:col-span-2">
              <p className="hv2-eyebrow text-[var(--text-faint)]">{col.label}</p>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.text}>
                    {l.to ? (
                      <Link
                        to={l.to}
                        className="text-[14.5px] text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
                      >
                        {l.text}
                      </Link>
                    ) : (
                      <a
                        href={l.href}
                        className="text-[14.5px] text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
                      >
                        {l.text}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-[var(--line)] py-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13.5px] text-[var(--text-faint)]">
              © {new Date().getFullYear()} Roof AI Lead Recovery. All rights reserved.
            </p>
            <p className="hv2-eyebrow text-[var(--text-faint)]">Recovering leads 24/7</p>
          </div>
          <p className="text-[12px] text-[var(--text-faint)]">
            Text us at (814) 936-2291. Msg &amp; data rates may apply. Reply STOP to cancel, HELP for help.{" "}
            <Link to="/privacy" className="underline hover:text-[var(--text-dim)]">Privacy Policy</Link>{" "}·{" "}
            <Link to="/terms" className="underline hover:text-[var(--text-dim)]">Terms of Service</Link>.
          </p>
        </div>
      </div>
    </footer>
  );
}
