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
  const candidates = staff.filter((p) => !existingProfileIds.has(p.id) && p.role === "doctor");

  return (
    <div className="space-y-8">
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
