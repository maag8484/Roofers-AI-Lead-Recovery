import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { GmailWarningBanner } from "@/components/admin/GmailWarningBanner";

// Persistent admin layout: permanent sidebar (>=lg) + drawer (<lg), a sticky
// top bar, and a scrollable content slot. Rendered as a layout route so the
// chrome stays mounted across admin page navigation.
export function AdminShell() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <GmailWarningBanner />
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-x-hidden p-4 lg:p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
