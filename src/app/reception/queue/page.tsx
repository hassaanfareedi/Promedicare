import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { getTodayAppointments } from "@/features/reception/data";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StaffAppointmentRow } from "@/features/reception/components/staff-appointment-row";
import { WalkInDialog } from "@/features/reception/components/walk-in-dialog";

export const metadata: Metadata = { title: "Queue" };

export default async function QueuePage() {
  const today = await getTodayAppointments();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Today's queue"
        description="Check patients in and out as they arrive."
        actions={<WalkInDialog />}
      />
      {today.length === 0 ? (
        <EmptyState icon={Clock} title="Queue is empty" description="No appointments scheduled for today." />
      ) : (
        <div className="space-y-3">
          {today.map((a) => (
            <StaffAppointmentRow key={a.id} a={a} allowReschedule={false} />
          ))}
        </div>
      )}
    </div>
  );
}
