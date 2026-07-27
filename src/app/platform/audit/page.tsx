import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ScrollText } from "lucide-react";
import { getAuditLogs } from "@/features/platform/data";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AuditTable } from "@/features/platform/components/audit-table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("platform");
  return { title: t("auditTitle") };
}

export default async function PlatformAuditPage() {
  const entries = await getAuditLogs(200);
  const t = await getTranslations("platform");

  return (
    <div className="space-y-6">
      <PageHeader title={t("auditTitle")} description={t("auditDesc")} />
      {entries.length === 0 ? (
        <EmptyState icon={ScrollText} title={t("auditEmptyTitle")} description={t("auditEmptyDesc")} />
      ) : (
        <AuditTable entries={entries} />
      )}
    </div>
  );
}
