import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="bg-ink-900 text-slate-300">
      <div className="container py-12">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <Logo dark />
          <nav className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
            <Link to="/privacy" className="text-slate-400 hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-slate-400 hover:text-white">
              Terms of Service
            </Link>
            <a href="mailto:support@roofaileadrecovery.com" className="text-slate-400 hover:text-white">
              Contact
            </a>
          </nav>
        </div>
        <div className="mt-8 border-t border-white/10 pt-6 space-y-3 text-sm">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
              <a href="mailto:support@roofaileadrecovery.com" className="text-brand-500 hover:text-brand-400">
                support@roofaileadrecovery.com
              </a>
            </div>
            <p className="text-slate-500">
              © {new Date().getFullYear()} Roof AI Lead Recovery. All rights reserved.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Msg &amp; data rates may apply. Reply STOP to cancel, HELP for help.{" "}
            <Link to="/privacy" className="underline hover:text-slate-300">Privacy Policy</Link>{" "}·{" "}
            <Link to="/terms" className="underline hover:text-slate-300">Terms of Service</Link>.
          </p>
        </div>
      </div>
    </footer>
  );
}
