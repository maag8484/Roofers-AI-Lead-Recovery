import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Database,
  ShieldCheck,
  CreditCard,
  Settings,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

// Single source of truth for the admin nav — Topbar reads this to resolve the
// current page title too. `end` marks index-exact matches.
export const ADMIN_NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/onboarding", label: "Customer Onboarding", icon: ClipboardList },
  { to: "/admin/scraped-leads", label: "Scraped Leads", icon: Database },
  { to: "/admin/audit", label: "Audit Logs", icon: ShieldCheck },
  { to: "/admin/billing", label: "Billing", icon: CreditCard },
  { to: "/admin/settings", label: "System Settings", icon: Settings },
];

function NavItems({ onNavigate }) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {ADMIN_NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-50 text-brand-700"
                : "text-muted-foreground hover:bg-secondary hover:text-ink"
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

// Permanent rail on >=lg; slide-in drawer below lg controlled by `open`.
export function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Desktop: permanent rail */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo />
        </div>
        <NavItems />
        <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          Admin console
        </div>
      </aside>

      {/* Mobile: overlay + drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/40"
            onClick={onClose}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col overflow-y-auto border-r border-border bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <Logo />
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavItems onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
