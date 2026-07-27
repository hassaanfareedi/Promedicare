import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("analyticsTitle") };
}

export default async function AdminAnalyticsPage() {
  const t = await getTranslations("admin");
  const [overview, analytics] = await Promise.all([getAdminOverview(), getAdminAnalytics()]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("analyticsTitle")} description={t("analyticsDesc")} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("totalAppointments")} value={analytics.totalAppointments} icon={CalendarDays} />
        <StatCard label={t("doctorsTitle")} value={overview.doctors} icon={BriefcaseMedical} />
        <StatCard label={t("patients")} value={overview.patients} icon={Users} />
        <StatCard
          label={t("feeIncomePkr")}
          value={Math.round(analytics.totalIncome).toLocaleString()}
          icon={Wallet}
        />
      </div>

      <AnalyticsCharts analytics={analytics} />
    </div>
  );
}
