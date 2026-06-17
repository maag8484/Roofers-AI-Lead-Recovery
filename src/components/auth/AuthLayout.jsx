import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

/** Centered card layout shared by login and signup. */
export function AuthLayout({ title, subtitle, children, footer, wide = false }) {
  return (
    <div className="hero-gradient flex min-h-screen flex-col">
      <header className="container flex h-16 items-center">
        <Link to="/" aria-label="Home">
          <Logo />
        </Link>
      </header>
      <main className="container flex flex-1 items-start justify-center py-8 sm:items-center">
        <div className={"w-full " + (wide ? "max-w-xl" : "max-w-md")}>
          <div className="rounded-2xl border border-border bg-white p-7 shadow-lg sm:p-8">
            {title && (
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
                {subtitle && <p className="mt-1.5 text-muted-foreground">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
          {footer && (
            <p className="mt-5 text-center text-sm text-muted-foreground">{footer}</p>
          )}
        </div>
      </main>
    </div>
  );
}
