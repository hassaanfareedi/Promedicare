import type { Metadata } from "next";
import { getAllSpecialties } from "@/features/platform/data";
import { PageHeader } from "@/components/shared/page-header";
import { SpecialtyManager } from "@/features/platform/components/specialty-manager";

export const metadata: Metadata = { title: "Specialties" };

export default async function PlatformSpecialtiesPage() {
  const specialties = await getAllSpecialties();
  return (
    <div className="space-y-6">
      <PageHeader title="Specialties" description="Manage the global list of medical specialties." />
      <SpecialtyManager specialties={specialties} />
    </div>
  );
}
