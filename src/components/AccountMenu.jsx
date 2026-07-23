import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

// Initials from a name ("John Smith" -> "JS") or email ("jane@x.com" -> "J").
function initialsFor(name, email) {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return (email?.[0] ?? "?").toUpperCase();
}

// Current-user account menu: avatar (initials) that opens a minimal dropdown
// with the user's display name, email, and Logout. No role text — every user
// is the same role, so showing it would read like an admin panel. Click-outside
// and Escape close it; keyboard-navigable.
export function AccountMenu({ extraItems }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const firstItemRef = useRef(null);

  const email = user?.email ?? "";
  const fullName = user?.user_metadata?.full_name?.trim() ?? "";
  // Requirement: name, or the part of the email before "@" if no name.
  const displayName = fullName || email.split("@")[0] || "Account";
  const initials = initialsFor(fullName, email);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    // Move focus to the first menu item for keyboard users.
    const t = setTimeout(() => firstItemRef.current?.focus(), 10);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open]);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate("/");
  };

  // Open + focus the menu on ArrowDown/Enter/Space from the trigger.
  const onTriggerKeyDown = (e) => {
    if (["ArrowDown", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 text-sm outline-none transition-colors",
          "hover:bg-secondary focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1",
          open && "bg-secondary"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white shadow-sm">
          {initials}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Account"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-border/70 bg-white shadow-xl ring-1 ring-black/[0.03]"
          >
            {/* Identity */}
            <div className="flex items-center gap-3 p-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white shadow-sm">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink" title={displayName}>
                  {displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground" title={email}>
                  {email}
                </p>
              </div>
            </div>

            <div className="h-px bg-border/70" />

            {/* Actions */}
            <div className="p-1.5">
              {extraItems}
              <button
                ref={firstItemRef}
                role="menuitem"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-ink outline-none transition-colors hover:bg-secondary focus-visible:bg-secondary"
              >
                <LogOut className="h-4 w-4 text-muted-foreground" /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
