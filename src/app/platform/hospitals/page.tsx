import type { Metadata } from "next";
import { getHospitals, getAllProfiles } from "@/features/platform/data";
import { PageHeader } from "@/components/shared/page-header";
import { HospitalManager } from "@/features/platform/components/hospital-manager";

export const metadata: Metadata = { title: "Hospitals" };

export default async function PlatformHospitalsPage() {
  const [hospitals, profiles] = await Promise.all([getHospitals(), getAllProfiles()]);
  return (
    <div className="space-y-8">
      <PageHeader title="Hospitals" description="Create hospitals and assign their administrators." />
      <HospitalManager hospitals={hospitals} profiles={profiles} />
    </div>
  );
}
