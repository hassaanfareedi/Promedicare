import type { Metadata } from "next";
import { getHospitals, getPlatformDoctors } from "@/features/platform/data";
import { PageHeader } from "@/components/shared/page-header";
import { DoctorTransferManager } from "@/features/platform/components/doctor-transfer-manager";

export const metadata: Metadata = { title: "Doctors" };

export default async function PlatformDoctorsPage() {
  const [doctors, hospitals] = await Promise.all([getPlatformDoctors(), getHospitals()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctors"
        description="View doctors across hospitals and transfer them when needed."
      />
      <DoctorTransferManager doctors={doctors} hospitals={hospitals} />
    </div>
  );
}
