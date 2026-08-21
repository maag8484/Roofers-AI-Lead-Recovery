import {
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
  ClipboardCheck,
  Bot,
  UserPlus,
  Calendar,
  TrendingUp,
  PieChart,
  ListFilter,
} from "lucide-react";
import { StatCard, computeDelta } from "@/components/admin/StatCard";
import { RecentSignupsPanel } from "@/components/admin/panels/RecentSignupsPanel";
import { RecentStatusChangesPanel } from "@/components/admin/panels/RecentStatusChangesPanel";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import { TrendAreaChart } from "@/components/admin/charts/TrendAreaChart";
import { PipelineBarChart } from "@/components/admin/charts/PipelineBarChart";
import { DonutChart } from "@/components/admin/charts/DonutChart";
import { useDashboardKpis } from "@/hooks/admin/useDashboardKpis";
import { useSignupTrend } from "@/hooks/admin/useSignupTrend";
import { useStatusBreakdown } from "@/hooks/admin/useStatusBreakdown";

export default function AdminDashboardOverviewPage() {
  const { data: kpi, loading: kpiLoading } = useDashboardKpis();
  const {
    data: trend,
    total: trendTotal,
    loading: trendLoading,
    error: trendError,
  } = useSignupTrend(30);
  const {
    data: breakdown,
    total: breakdownTotal,
    loading: breakdownLoading,
    error: breakdownError,
  } = useStatusBreakdown();

  // Only statuses that actually have customers — 13 rows of mostly zeros is a
  // table, not a chart.
  const activeStages = breakdown.filter((d) => d.value > 0);

  // "Completed" already includes LIVE, so subtract it to keep the donut a true
  // part-to-whole rather than double-counting live customers.
  const donutSegments = [
    { label: "Live", value: kpi?.activeLive ?? 0, color: "#10b981" },
    {
      label: "In setup",
      value: Math.max(0, (kpi?.completed ?? 0) - (kpi?.activeLive ?? 0)),
      color: "#2563eb",
    },
    { label: "Pending onboarding", value: kpi?.pending ?? 0, color: "#f59e0b" },
  ];
  const donutTotal = donutSegments.reduce((s, x) => s + x.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink">Overview</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Customer pipeline, onboarding progress, and recent account activity.
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      {/* Signup trend — full width so 30 daily points have room to breathe. */}
      <ChartCard
        title="Signups over time"
        subtitle="New customer accounts per day, last 30 days"
        icon={TrendingUp}
        right={
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
            {trendTotal} total
          </span>
        }
        loading={trendLoading}
        error={trendError}
        empty={trendTotal === 0}
        emptyText="No signups in the last 30 days."
      >
        <TrendAreaChart data={trend} valueLabel="signups" />
      </ChartCard>

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <ChartCard
          title="Onboarding status"
          subtitle="Where every customer sits right now"
          icon={PieChart}
          loading={kpiLoading}
          empty={donutTotal === 0}
          emptyText="No customers yet."
        >
          <DonutChart
            segments={donutSegments}
            centerValue={kpi?.total ?? 0}
            centerLabel="customers"
          />
        </ChartCard>

        <ChartCard
          title="Pipeline by stage"
          subtitle="Customer count per lifecycle status"
          icon={ListFilter}
          loading={breakdownLoading}
          error={breakdownError}
          empty={activeStages.length === 0}
          emptyText="No customers to break down yet."
        >
          <PipelineBarChart data={activeStages} total={breakdownTotal} />
        </ChartCard>
      </div>

      {/* Recent-activity panels. Each panel caps its own scroll well so the
          page doesn't grow ~10 rows tall per panel. */}
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <div className="min-w-0">
          <RecentSignupsPanel />
        </div>
        <div className="min-w-0">
          <RecentStatusChangesPanel />
        </div>
      </div>
    </div>
  );
}
