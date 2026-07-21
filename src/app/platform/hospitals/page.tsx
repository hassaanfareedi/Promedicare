import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getHospitals, getAllProfiles } from "@/features/platform/data";
import { PageHeader } from "@/components/shared/page-header";
import { HospitalManager } from "@/features/platform/components/hospital-manager";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("platform");
  return { title: t("hospitalsTitle") };
}

export default async function PlatformHospitalsPage() {
  const [hospitals, profiles] = await Promise.all([getHospitals(), getAllProfiles()]);
  const t = await getTranslations("platform");
  return (
    <div className="space-y-8">
      <PageHeader title={t("hospitalsTitle")} description={t("hospitalsDesc")} />
      <HospitalManager hospitals={hospitals} profiles={profiles} />
    </div>
  );
}
