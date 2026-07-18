import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import { getAuditLogs } from "@/features/platform/data";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AuditTable } from "@/features/platform/components/audit-table";

export const metadata: Metadata = { title: "Audit logs" };

export default async function PlatformAuditPage() {
  const entries = await getAuditLogs(200);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit logs" description="A tamper-evident record of key actions across the platform." />
      {entries.length === 0 ? (
        <EmptyState icon={ScrollText} title="No activity yet" description="Audited actions will appear here." />
      ) : (
        <AuditTable entries={entries} />
      )}
    </div>
  );
}
