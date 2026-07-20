import type { Metadata } from "next";
import {
  getDoctorsAdmin,
  getStaff,
  getSpecialties,
  getDepartments,
  getPromotableProfiles,
} from "@/features/admin/data";
import { PageHeader } from "@/components/shared/page-header";
import { DoctorManager } from "@/features/admin/components/doctor-manager";

export const metadata: Metadata = { title: "Doctors" };

export default async function AdminDoctorsPage() {
  const [doctors, staff, specialties, departments, promotable] = await Promise.all([
    getDoctorsAdmin(),
    getStaff(),
    getSpecialties(),
    getDepartments(),
    getPromotableProfiles(),
  ]);

  const existingProfileIds = new Set(
    doctors.map((d) => d.profile?.id).filter((id): id is string => Boolean(id)),
  );

  // One-step Add doctor: any doctor/receptionist without a clinical profile, plus
  // patients that can be promoted — admins stay admins.
  const byId = new Map(
    [...staff, ...promotable]
      .filter(
        (p) =>
          !existingProfileIds.has(p.id) &&
          p.role !== "hospital_admin" &&
          p.role !== "super_admin",
      )
      .map((p) => [p.id, p]),
  );
  const candidates = [...byId.values()].sort((a, b) =>
    (a.full_name ?? a.email ?? "").localeCompare(b.full_name ?? b.email ?? ""),
  );

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
