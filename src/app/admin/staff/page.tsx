import type { Metadata } from "next";
import { UserCog } from "lucide-react";
import { getStaff } from "@/features/admin/data";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StaffTable } from "@/features/admin/components/staff-table";

export const metadata: Metadata = { title: "Staff" };

export default async function AdminStaffPage() {
  const staff = await getStaff();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Assign roles to people in your hospital. Users appear here once they belong to your hospital."
      />
      {staff.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No staff yet"
          description="Invite team members to sign up; once linked to your hospital you can assign their roles here."
        />
      ) : (
        <StaffTable staff={staff} />
      )}
    </div>
  );
}
