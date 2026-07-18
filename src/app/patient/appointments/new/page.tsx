import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { getBookingDoctors, getBookingHospitals } from "@/features/appointments/data";
import { BookingWizard } from "@/features/appointments/components/booking-wizard";

export const metadata: Metadata = { title: "Book appointment" };

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ specialty?: string; prediction?: string }>;
}) {
  const { specialty, prediction } = await searchParams;
  const [hospitals, doctors] = await Promise.all([getBookingHospitals(), getBookingDoctors()]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Book an appointment" description="Choose a hospital, doctor and time that suits you." />
      <BookingWizard
        hospitals={hospitals}
        doctors={doctors}
        recommendedSpecialtyId={specialty}
        predictionId={prediction}
      />
    </div>
  );
}
