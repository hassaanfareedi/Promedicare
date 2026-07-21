import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getHospitals, getPlatformDoctors } from "@/features/platform/data";
import { PageHeader } from "@/components/shared/page-header";
import { DoctorTransferManager } from "@/features/platform/components/doctor-transfer-manager";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("platform");
  return { title: t("doctorsTitle") };
}

export default async function PlatformDoctorsPage() {
  const t = await getTranslations("platform");
  const [doctors, hospitals] = await Promise.all([getPlatformDoctors(), getHospitals()]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("doctorsTitle")} description={t("doctorsDesc")} />
      <DoctorTransferManager doctors={doctors} hospitals={hospitals} />
    </div>
  );
}
