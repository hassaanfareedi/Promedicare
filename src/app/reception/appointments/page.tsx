import type { Metadata } from "next";
import { CalendarDays, CalendarPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  getHospitalAppointments,
  sortAppointmentsPendingFirst,
} from "@/features/reception/data";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/shared/link-button";
import { StaffAppointmentRow } from "@/features/reception/components/staff-appointment-row";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reception");
  return { title: t("appointmentsTitle") };
}

export default async function ReceptionAppointmentsPage() {
  const t = await getTranslations("reception");
  const appointments = sortAppointmentsPendingFirst(await getHospitalAppointments());

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("appointmentsTitle")}
        description={t("appointmentsDesc")}
        actions={
          <LinkButton href="/reception/appointments/new" size="sm">
            <CalendarPlus className="size-4" aria-hidden /> {t("bookAppointment")}
          </LinkButton>
        }
      />
      {appointments.length === 0 ? (
        <EmptyState icon={CalendarDays} title={t("noAppointments")} description={t("appointmentsEmptyDesc")} />
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
