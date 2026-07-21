import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getDepartments } from "@/features/admin/data";
import { PageHeader } from "@/components/shared/page-header";
import { DepartmentManager } from "@/features/admin/components/department-manager";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("departmentsTitle") };
}

export default async function AdminDepartmentsPage() {
  const departments = await getDepartments();
  const t = await getTranslations("admin");
  return (
    <div className="space-y-8">
      <PageHeader title={t("departmentsTitle")} description={t("departmentsDesc")} />
      <DepartmentManager departments={departments} />
    </div>
  );
}
