import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

const SETUP_STEPS = [
  { key: "twilio", label: "Phone Number", path: "/setup/twilio" },
  { key: "calendar", label: "Calendar", path: "/setup/calendar" },
  { key: "live", label: "Go Live", path: "/dashboard" },
];

/** Shared chrome for the /setup/* wizard pages. */
export function SetupLayout({ current, children }) {
  const currentIdx = SETUP_STEPS.findIndex((s) => s.key === current);

  return (
    <div className="hero-gradient min-h-screen">
      <header className="container flex h-16 items-center">
        <Link to="/" aria-label="Home">
          <Logo />
        </Link>
      </header>

      <main className="container max-w-2xl py-6 pb-16">
        {/* Wizard progress */}
        <ol className="mb-8 flex items-center justify-center gap-2 sm:gap-4">
          {SETUP_STEPS.map((s, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <li key={s.key} className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold",
                      done && "border-emerald-500 bg-emerald-500 text-white",
                      active && "border-brand-600 bg-brand-600 text-white",
                      !done && !active && "border-border bg-white text-muted-foreground"
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "hidden text-sm font-medium sm:inline",
                      active ? "text-ink" : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < SETUP_STEPS.length - 1 && (
                  <span className={cn("h-0.5 w-6 rounded sm:w-10", done ? "bg-emerald-500" : "bg-border")} />
                )}
              </li>
            );
          })}
        </ol>

        {children}
      </main>
    </div>
  );
}
