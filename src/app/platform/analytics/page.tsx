import type { Metadata } from "next";
import { getPlatformAnalytics } from "@/features/platform/data";
import { PageHeader } from "@/components/shared/page-header";
import { PlatformAnalyticsView } from "@/features/platform/components/platform-analytics";

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
