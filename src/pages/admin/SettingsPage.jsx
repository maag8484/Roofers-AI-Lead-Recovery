import { useState } from "react";
import { Mail, Users, BellRing } from "lucide-react";
import { GmailSettingsTab } from "@/components/admin/settings/GmailSettingsTab";
import { AdminUsersTab } from "@/components/admin/settings/AdminUsersTab";
import { NotificationPreferencesTab } from "@/components/admin/settings/NotificationPreferencesTab";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "gmail", label: "Gmail Integration", icon: Mail },
  { key: "admins", label: "Admin Users", icon: Users },
  { key: "prefs", label: "Notification Preferences", icon: BellRing },
];

export default function AdminSettingsPage() {
  const [tab, setTab] = useState("gmail");

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-muted-foreground hover:text-ink"
            )}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "gmail" && <GmailSettingsTab />}
      {tab === "admins" && <AdminUsersTab />}
      {tab === "prefs" && <NotificationPreferencesTab />}
    </div>
  );
}
