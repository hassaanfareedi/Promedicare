import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { AccountSettingsSections } from "@/features/account/components/account-settings-sections";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reception");
  return { title: t("settingsTitle") };
}

export default async function ReceptionSettingsPage() {
  await requireRole(["receptionist"]);
  const t = await getTranslations("reception");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t("settingsTitle")} description={t("settingsDesc")} />
      <AccountSettingsSections />
    </div>
  );
}
