import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import {
  getHospitalAppointments,
  sortAppointmentsPendingFirst,
} from "@/features/reception/data";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StaffAppointmentRow } from "@/features/reception/components/staff-appointment-row";

export const metadata: Metadata = { title: "Appointments" };

export default async function AdminAppointmentsPage() {
  const appointments = sortAppointmentsPendingFirst(await getHospitalAppointments());

  return (
    <div className="space-y-8">
      <PageHeader
        title="Appointments"
        description="All appointments across your hospital. Pending requests first, then by time."
      />
      {appointments.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No appointments" description="Appointments will appear here." />
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <StaffAppointmentRow key={a.id} a={a} />
          ))}
        </div>
      )}
    </div>
  );
}
