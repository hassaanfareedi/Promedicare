import type { Metadata } from "next";
import { UserCog } from "lucide-react";
import { getPromotableProfiles, getStaff } from "@/features/admin/data";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StaffTable } from "@/features/admin/components/staff-table";
import { PromoteStaffDialog } from "@/features/admin/components/promote-staff-dialog";

export const metadata: Metadata = { title: "Staff" };

export default async function AdminStaffPage() {
  const [staff, candidates] = await Promise.all([getStaff(), getPromotableProfiles()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Promote hospital users to Doctor or Receptionist, then manage their assignment."
        actions={<PromoteStaffDialog candidates={candidates} />}
      />
      {staff.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No staff yet"
          description="Use Promote to staff to turn a patient account into Doctor or Receptionist."
        />
      ) : (
        <StaffTable staff={staff} />
      )}
    </div>
  );
}
