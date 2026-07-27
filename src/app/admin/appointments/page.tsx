import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  getHospitalAppointments,
  sortAppointmentsPendingFirst,
} from "@/features/reception/data";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StaffAppointmentRow } from "@/features/reception/components/staff-appointment-row";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("appointmentsTitle") };
}

export default async function AdminAppointmentsPage() {
  const t = await getTranslations("admin");
  const appointments = sortAppointmentsPendingFirst(await getHospitalAppointments());

  return (
    <div className="space-y-8">
      <PageHeader title={t("appointmentsTitle")} description={t("appointmentsDesc")} />
      {appointments.length === 0 ? (
        <EmptyState icon={CalendarDays} title={t("noAppointments")} description={t("noAppointmentsDesc")} />
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
