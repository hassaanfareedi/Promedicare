import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { AccountSettingsSections } from "@/features/account/components/account-settings-sections";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("doctor");
  return { title: t("settingsTitle") };
}

export default async function DoctorSettingsPage() {
  await requireRole(["doctor"]);
  const t = await getTranslations("doctor");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t("settingsTitle")} description={t("settingsDesc")} />
      <AccountSettingsSections />
    </div>
  );
}
