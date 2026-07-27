import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { getMyHospital } from "@/features/admin/data";
import { PageHeader } from "@/components/shared/page-header";
import { AccountSettingsSections } from "@/features/account/components/account-settings-sections";
import { HospitalSettingsForm } from "@/features/admin/components/hospital-settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("settingsTitle") };
}

export default async function AdminSettingsPage() {
  await requireRole(["hospital_admin"]);
  const hospital = await getMyHospital();
  const t = await getTranslations("admin");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t("settingsTitle")} description={t("settingsDesc")} />

      <AccountSettingsSections />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-teal-600" /> {t("hospitalDetails")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hospital ? (
            <HospitalSettingsForm hospital={hospital} />
          ) : (
            <EmptyState
              icon={Building2}
              title={t("noHospitalLinked")}
              description={t("noHospitalLinkedDesc")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
