import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import { AccountMenu } from "@/components/AccountMenu";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { GlobalSearchModal } from "@/components/admin/GlobalSearchModal";
import { ADMIN_NAV } from "./Sidebar";

// Resolve the current page title from the nav config (longest matching prefix).
function usePageTitle() {
  const { pathname } = useLocation();
  const match = [...ADMIN_NAV]
    .filter((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return match?.label ?? "Admin";
}

export function Topbar({ onOpenMenu }) {
  const title = usePageTitle();
  const [searchOpen, setSearchOpen] = useState(false);

  // ⌘K / Ctrl+K opens global search from any admin page. Ignore when the user
  // is typing in a field (except to still allow the shortcut with modifier).
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-white px-4 lg:px-6">
      <button
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="min-w-0 flex-1 truncate text-base font-bold text-ink lg:text-lg">{title}</h1>

      {/* Global search trigger (opens the ⌘K modal). */}
      <div className="ml-auto hidden max-w-sm flex-1 md:block">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-secondary/40 px-3 text-sm text-muted-foreground hover:bg-secondary"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search customers, logs, notifications…</span>
          <kbd className="rounded border border-border bg-white px-1.5 text-[11px]">⌘K</kbd>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 md:ml-2">
        {/* Mobile search icon */}
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Search"
          className="rounded-lg p-2 text-muted-foreground hover:bg-secondary md:hidden"
        >
          <Search className="h-5 w-5" />
        </button>

        <NotificationBell />
        <AccountMenu />
      </div>

      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
