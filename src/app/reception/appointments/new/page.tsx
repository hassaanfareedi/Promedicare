import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { getHospitalPatients, getWalkInDoctors } from "@/features/reception/data";
import { ReceptionBookingWizard } from "@/features/reception/components/reception-booking-wizard";

export const metadata: Metadata = { title: "Book appointment" };

export default async function ReceptionNewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string }>;
}) {
  const { patient } = await searchParams;
  const [patients, doctors] = await Promise.all([getHospitalPatients(), getWalkInDoctors()]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Book an appointment"
        description="Schedule a future visit for a new or existing patient."
      />
      <ReceptionBookingWizard
        patients={patients}
        doctors={doctors}
        initialPatientId={patient}
      />
    </div>
  );
}
