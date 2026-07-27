import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { getHospitalPatients, getWalkInDoctors } from "@/features/reception/data";
import { ReceptionBookingWizard } from "@/features/reception/components/reception-booking-wizard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reception");
  return { title: t("bookTitle") };
}

export default async function ReceptionNewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string }>;
}) {
  const t = await getTranslations("reception");
  const { patient } = await searchParams;
  const [patients, doctors] = await Promise.all([getHospitalPatients(), getWalkInDoctors()]);

  // Only honour a ?patient= deep link if it resolves to a real hospital patient,
  // so a stale/tampered id can't pre-select a patient the wizard can't book.
  const initialPatientId = patient && patients.some((p) => p.id === patient) ? patient : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t("bookTitle")} description={t("bookDesc")} />
      <ReceptionBookingWizard
        patients={patients}
        doctors={doctors}
        initialPatientId={initialPatientId}
      />
    </div>
  );
}
