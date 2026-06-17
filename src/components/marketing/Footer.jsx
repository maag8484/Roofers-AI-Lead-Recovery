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
            <a href="mailto:hello@roofaileadrecovery.com" className="text-slate-400 hover:text-white">
              Contact
            </a>
          </nav>
        </div>
        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-sm sm:flex-row sm:items-center">
          <a
            href="mailto:hello@roofaileadrecovery.com"
            className="text-brand-500 hover:text-brand-400"
          >
            hello@roofaileadrecovery.com
          </a>
          <p className="text-slate-500">
            © {new Date().getFullYear()} Roof AI Lead Recovery. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
