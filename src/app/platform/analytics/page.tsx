import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";
import { getPlatformAnalytics } from "@/features/platform/data";
import { PageHeader } from "@/components/shared/page-header";

const PlatformAnalyticsView = dynamic(
  () =>
    import("@/features/platform/components/platform-analytics").then((m) => m.PlatformAnalyticsView),
  {
    loading: () => (
      <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground" role="status">
        Loading analytics…
      </div>
    ),
  },
);

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("platform");
  return { title: t("analyticsTitle") };
}

export default async function PlatformAnalyticsPage() {
  const analytics = await getPlatformAnalytics();
  const t = await getTranslations("platform");
  return (
    <div className="space-y-8">
      <PageHeader title={t("analyticsTitle")} description={t("analyticsDesc")} />
      <PlatformAnalyticsView analytics={analytics} />
    </div>
  );
}
