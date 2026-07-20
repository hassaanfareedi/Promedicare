import type { Metadata } from "next";
import { getPromotableProfiles, getStaff } from "@/features/admin/data";
import { PageHeader } from "@/components/shared/page-header";
import { StaffManager } from "@/features/admin/components/staff-manager";
import { PromoteStaffDialog } from "@/features/admin/components/promote-staff-dialog";

export const metadata: Metadata = { title: "Staff" };

export default async function AdminStaffPage() {
  const [staff, candidates] = await Promise.all([getStaff(), getPromotableProfiles()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Manage doctors and receptionists for your hospital — promote patients, create accounts, or demote when needed."
      />
      <StaffManager staff={staff} promoteAction={<PromoteStaffDialog candidates={candidates} />} />
    </div>
  );
}
