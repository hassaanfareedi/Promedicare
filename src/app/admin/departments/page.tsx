import type { Metadata } from "next";
import { getDepartments } from "@/features/admin/data";
import { PageHeader } from "@/components/shared/page-header";
import { DepartmentManager } from "@/features/admin/components/department-manager";

export const metadata: Metadata = { title: "Departments" };

export default async function AdminDepartmentsPage() {
  const departments = await getDepartments();
  return (
    <div className="space-y-8">
      <PageHeader title="Departments" description="Organise your hospital into departments." />
      <DepartmentManager departments={departments} />
    </div>
  );
}
