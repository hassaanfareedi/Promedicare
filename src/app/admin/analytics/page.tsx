import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { CalendarDays, Users, BriefcaseMedical, Wallet } from "lucide-react";
import { getAdminAnalytics, getAdminOverview } from "@/features/admin/data";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";

const AnalyticsCharts = dynamic(
  () =>
    import("@/features/admin/components/analytics-charts").then((m) => m.AnalyticsCharts),
  {
    loading: () => (
      <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground" role="status">
        Loading charts…
      </div>
    ),
  },
);

export const metadata: Metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  const [overview, analytics] = await Promise.all([getAdminOverview(), getAdminAnalytics()]);

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Insights across your hospital's activity." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total appointments" value={analytics.totalAppointments} icon={CalendarDays} />
        <StatCard label="Doctors" value={overview.doctors} icon={BriefcaseMedical} />
        <StatCard label="Patients" value={overview.patients} icon={Users} />
        <StatCard
          label="Fee income (PKR)"
          value={Math.round(analytics.totalIncome).toLocaleString()}
          icon={Wallet}
        />
      </div>

      <AnalyticsCharts analytics={analytics} />
    </div>
  );
}
