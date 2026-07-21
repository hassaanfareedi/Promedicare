import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPromotableProfiles, getStaff } from "@/features/admin/data";
import { PageHeader } from "@/components/shared/page-header";
import { StaffManager } from "@/features/admin/components/staff-manager";
import { PromoteStaffDialog } from "@/features/admin/components/promote-staff-dialog";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("staffTitle") };
}

export default async function AdminStaffPage() {
  const t = await getTranslations("admin");
  const [staff, candidates] = await Promise.all([getStaff(), getPromotableProfiles()]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("staffTitle")} description={t("staffDesc")} />
      <StaffManager staff={staff} promoteAction={<PromoteStaffDialog candidates={candidates} />} />
    </div>
  );
}
