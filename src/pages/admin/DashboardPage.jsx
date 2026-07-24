import {
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
  ClipboardCheck,
  Bot,
  UserPlus,
  Calendar,
  MailCheck,
  MailX,
  Mail,
  Activity,
} from "lucide-react";
import { StatCard, computeDelta } from "@/components/admin/StatCard";
import { EmailHealthCard } from "@/components/admin/EmailHealthCard";
import { RecentSignupsPanel } from "@/components/admin/panels/RecentSignupsPanel";
import { RecentStatusChangesPanel } from "@/components/admin/panels/RecentStatusChangesPanel";
import { RecentErrorsPanel } from "@/components/admin/panels/RecentErrorsPanel";
import { RecentEmailEventsPanel } from "@/components/admin/panels/RecentEmailEventsPanel";
import { useDashboardKpis } from "@/hooks/admin/useDashboardKpis";
import { useEmailHealth } from "@/hooks/admin/useEmailHealth";

// Derive System Health from real signals: green if Gmail CONNECTED and no 24h
// failures; amber if CONNECTED but failures > 0; red if Gmail not connected.
function systemHealth(gmailStatus, failed24) {
  if (gmailStatus !== "CONNECTED") return { tone: "red", label: "Degraded" };
  if ((failed24 ?? 0) > 0) return { tone: "amber", label: "Warning" };
  return { tone: "green", label: "Healthy" };
}

export default function AdminDashboardOverviewPage() {
  const { data: kpi, loading: kpiLoading } = useDashboardKpis();
  const { data: email, loading: emailLoading } = useEmailHealth();

  const gmailStatus = email?.status ?? "DISCONNECTED";
  const health = systemHealth(gmailStatus, kpi?.emailsFailed24);
  const gmailTone = gmailStatus === "CONNECTED" ? "green" : "red";

  return (
    <div className="space-y-6">
      {/* Email health — prominent, full-width above the grid. */}
      <EmailHealthCard />

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard icon={Building2} tone="brand" label="Total Customers" value={kpi?.total} loading={kpiLoading} />
        <StatCard icon={CheckCircle2} tone="green" label="Active (Live)" value={kpi?.activeLive} loading={kpiLoading} />
        <StatCard icon={CreditCard} tone="brand" label="Trial" value={kpi?.trial} loading={kpiLoading} />
        <StatCard icon={Loader2} tone="amber" label="Pending Onboarding" value={kpi?.pending} loading={kpiLoading} />
        <StatCard icon={ClipboardCheck} tone="green" label="Completed Onboarding" value={kpi?.completed} loading={kpiLoading} />
        <StatCard icon={Bot} tone="brand" label="AI Activated" value={kpi?.aiActivated} loading={kpiLoading} />
        <StatCard
          icon={UserPlus}
          tone="brand"
          label="Recent Signups (7d)"
          value={kpi?.signups7}
          delta={kpi ? computeDelta(kpi.signups7, kpi.signupsPrev7) : null}
          loading={kpiLoading}
        />
        <StatCard icon={Calendar} tone="brand" label="Total Appointments" value={kpi?.appointments} loading={kpiLoading} />
        <StatCard
          icon={MailCheck}
          tone="green"
          label="Emails Sent (24h)"
          value={kpi?.emailsSent24}
          delta={kpi ? computeDelta(kpi.emailsSent24, kpi.emailsSentPrev24) : null}
          loading={kpiLoading}
        />
        <StatCard
          icon={MailX}
          tone="red"
          label="Failed Emails (24h)"
          value={kpi?.emailsFailed24}
          delta={kpi ? computeDelta(kpi.emailsFailed24, kpi.emailsFailedPrev24) : null}
          loading={kpiLoading}
        />
        <StatCard icon={Mail} tone={gmailTone} label="Gmail Status" value={gmailStatus} loading={emailLoading} />
        <StatCard icon={Activity} tone={health.tone} label="System Health" value={health.label} loading={kpiLoading || emailLoading} />
      </div>

      {/* Recent-activity panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentSignupsPanel />
        <RecentStatusChangesPanel />
        <RecentErrorsPanel />
        <RecentEmailEventsPanel />
      </div>
    </div>
  );
}
