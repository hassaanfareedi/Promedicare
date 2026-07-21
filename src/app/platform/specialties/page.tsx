import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAllSpecialties } from "@/features/platform/data";
import { PageHeader } from "@/components/shared/page-header";
import { SpecialtyManager } from "@/features/platform/components/specialty-manager";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("platform");
  return { title: t("specialtiesTitle") };
}

export default async function PlatformSpecialtiesPage() {
  const specialties = await getAllSpecialties();
  const t = await getTranslations("platform");
  return (
    <div className="space-y-6">
      <PageHeader title={t("specialtiesTitle")} description={t("specialtiesDesc")} />
      <SpecialtyManager specialties={specialties} />
    </div>
  );
}
