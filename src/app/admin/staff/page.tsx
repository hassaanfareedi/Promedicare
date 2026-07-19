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
        description="Assign Doctor or Receptionist among hospital staff. Patients are not listed here."
      />
      {staff.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No staff yet"
          description="Hospital staff with Doctor or Receptionist roles will appear here so you can switch their assignment."
        />
      ) : (
        <StaffTable staff={staff} />
      )}
    </div>
  );
}
