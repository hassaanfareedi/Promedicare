import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { getBookingDoctors, getBookingHospitals } from "@/features/appointments/data";
import { BookingWizard } from "@/features/appointments/components/booking-wizard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("patient");
  return { title: t("bookTitle") };
}

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ specialty?: string; prediction?: string }>;
}) {
  const { specialty, prediction } = await searchParams;
  const [hospitals, doctors] = await Promise.all([getBookingHospitals(), getBookingDoctors()]);
  const t = await getTranslations("patient");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t("bookTitle")} description={t("bookDesc")} />
      <BookingWizard
        hospitals={hospitals}
        doctors={doctors}
        recommendedSpecialtyId={specialty}
        predictionId={prediction}
      />
    </div>
  );
}
