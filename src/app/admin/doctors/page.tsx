import type { Metadata } from "next";
import { getDoctorsAdmin, getStaff, getSpecialties, getDepartments } from "@/features/admin/data";
import { PageHeader } from "@/components/shared/page-header";
import { DoctorManager } from "@/features/admin/components/doctor-manager";

export const metadata: Metadata = { title: "Doctors" };

export default async function AdminDoctorsPage() {
  const [doctors, staff, specialties, departments] = await Promise.all([
    getDoctorsAdmin(),
    getStaff(),
    getSpecialties(),
    getDepartments(),
  ]);

  const existingProfileIds = new Set(doctors.map((d) => d.profile?.id).filter(Boolean));
  const candidates = staff.filter(
    (p) => p.role === "doctor" && !existingProfileIds.has(p.id),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Doctors" description="Manage doctors and their weekly availability." />
      <DoctorManager
        doctors={doctors}
        candidates={candidates}
        specialties={specialties}
        departments={departments}
      />
    </div>
  );
}
