import {
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
  ClipboardCheck,
  Bot,
  UserPlus,
  Calendar,
} from "lucide-react";
import { StatCard, computeDelta } from "@/components/admin/StatCard";
import { RecentSignupsPanel } from "@/components/admin/panels/RecentSignupsPanel";
import { RecentStatusChangesPanel } from "@/components/admin/panels/RecentStatusChangesPanel";
import { RecentErrorsPanel } from "@/components/admin/panels/RecentErrorsPanel";
import { useDashboardKpis } from "@/hooks/admin/useDashboardKpis";

export default function AdminDashboardOverviewPage() {
  const { data: kpi, loading: kpiLoading } = useDashboardKpis();

  return (
    <div className="space-y-6">
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
      </div>

      {/* Recent-activity panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentSignupsPanel />
        <RecentStatusChangesPanel />
        <div className="lg:col-span-2">
          <RecentErrorsPanel />
        </div>
      </div>
    </div>
  );
}
