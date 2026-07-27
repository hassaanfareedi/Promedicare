import type { Metadata } from "next";
import { CalendarDays, Users, UserCheck, Clock, CalendarPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getReceptionOverview, getWalkInDoctors } from "@/features/reception/data";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionLink } from "@/components/shared/section-link";
import { QuickLink } from "@/components/shared/quick-link";
import { LinkButton } from "@/components/shared/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaffAppointmentRow } from "@/features/reception/components/staff-appointment-row";
import { WalkInDialog } from "@/features/reception/components/walk-in-dialog";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reception");
  return { title: t("dashboardTitle") };
}

export default async function ReceptionDashboard() {
  const t = await getTranslations("reception");
  const [{ today, waiting, patientCount }, doctors] = await Promise.all([
    getReceptionOverview(),
    getWalkInDoctors(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        hero
        title={t("dashboardTitle")}
        description={t("dashboardDesc")}
        actions={
          <>
            <LinkButton href="/reception/appointments/new" variant="outline">
              <CalendarPlus className="size-4" aria-hidden /> {t("bookAppointment")}
            </LinkButton>
            <WalkInDialog doctors={doctors} />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("statTodayAppointments")} value={today.length} icon={CalendarDays} />
        <StatCard label={t("statWaiting")} value={waiting} icon={UserCheck} />
        <StatCard label={t("patientsTitle")} value={patientCount} icon={Users} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t("todayQueue")}</CardTitle>
          <SectionLink href="/reception/queue">{t("openQueue")}</SectionLink>
        </CardHeader>
        <CardContent className="space-y-3">
          {today.length === 0 ? (
            <EmptyState
              icon={Clock}
              title={t("noAppointmentsToday")}
              description={t("todayQueueEmptyDesc")}
            />
          ) : (
            today.slice(0, 6).map((a) => (
              <StaffAppointmentRow key={a.id} a={a} allowReschedule={false} />
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <QuickLink
          href="/reception/appointments"
          title={t("appointmentsTitle")}
          description={t("quickAppointmentsDesc")}
          icon={CalendarDays}
        />
        <QuickLink
          href="/reception/patients"
          title={t("patientsTitle")}
          description={t("quickPatientsDesc")}
          icon={Users}
        />
      </div>
    </div>
  );
}
