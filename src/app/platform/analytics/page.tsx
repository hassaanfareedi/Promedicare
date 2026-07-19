import type { Metadata } from "next";
import dynamic from "next/dynamic";
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

export const metadata: Metadata = { title: "Platform analytics" };

export default async function PlatformAnalyticsPage() {
  const analytics = await getPlatformAnalytics();
  return (
    <div className="space-y-6">
      <PageHeader title="Platform analytics" description="Activity across every hospital on ProMediCare AI." />
      <PlatformAnalyticsView analytics={analytics} />
    </div>
  );
}
