import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CalendarPlus } from "lucide-react";
import {
  getHospitalAppointments,
  sortAppointmentsPendingFirst,
} from "@/features/reception/data";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { StaffAppointmentRow } from "@/features/reception/components/staff-appointment-row";

export const metadata: Metadata = { title: "Appointments" };

export default async function ReceptionAppointmentsPage() {
  const appointments = sortAppointmentsPendingFirst(await getHospitalAppointments());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Pending requests first, then by time across your hospital."
        actions={
          <Link
            href="/reception/appointments/new"
            className={buttonVariants({ size: "sm" })}
          >
            <CalendarPlus className="size-4" aria-hidden /> Book appointment
          </Link>
        }
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
