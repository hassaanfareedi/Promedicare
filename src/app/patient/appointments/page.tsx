import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CalendarDays, CalendarPlus } from "lucide-react";
import { getMyAppointments, type AppointmentView } from "@/features/patient/data";
import { PatientAppointmentCard } from "@/features/patient/components/patient-appointment-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/shared/link-button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CancelAppointmentButton } from "@/features/appointments/components/cancel-appointment-button";
import { RescheduleDialog } from "@/features/appointments/components/reschedule-dialog";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("patient");
  return { title: t("appointmentsTitle") };
}

const CANCELLABLE = new Set(["pending", "confirmed"]);
const ACTIVE = new Set(["pending", "confirmed", "checked_in", "in_progress"]);

function AppointmentRow({ a }: { a: AppointmentView }) {
  const upcoming = new Date(a.scheduled_start) >= new Date() && ACTIVE.has(a.status);
  return (
    <PatientAppointmentCard
      appointment={a}
      actions={
        upcoming && CANCELLABLE.has(a.status) ? (
          <>
            <RescheduleDialog appointmentId={a.id} doctorId={a.doctor_id} />
            <CancelAppointmentButton appointmentId={a.id} />
          </>
        ) : undefined
      }
    />
  );
}

export default async function AppointmentsPage() {
  const t = await getTranslations("patient");
  const all = await getMyAppointments();
  const now = new Date();
  const upcoming = all
    .filter((a) => new Date(a.scheduled_start) >= now && ACTIVE.has(a.status))
    .sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start));
  const past = all.filter((a) => !(new Date(a.scheduled_start) >= now && ACTIVE.has(a.status)));

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("appointmentsTitle")}
        description={t("appointmentsDesc")}
        actions={
          <LinkButton href="/patient/appointments/new">
            <CalendarPlus className="size-4" aria-hidden /> {t("bookCta")}
          </LinkButton>
        }
      />

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            {t("upcoming")} ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            {t("past")} ({past.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title={t("noAppointments")}
              description={t("appointmentsDesc")}
              action={
                <LinkButton href="/patient/appointments/new">
                  <CalendarPlus className="size-4" aria-hidden /> {t("bookCta")}
                </LinkButton>
              }
            />
          ) : (
            upcoming.map((a) => <AppointmentRow key={a.id} a={a} />)
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-3">
          {past.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title={t("pastEmptyTitle")}
              description={t("pastEmptyDesc")}
            />
          ) : (
            past.map((a) => <AppointmentRow key={a.id} a={a} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
