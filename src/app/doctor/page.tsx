import type { Metadata } from "next";
import { CalendarDays, Stethoscope, Users, Clock, ClipboardList } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getDoctorOverview } from "@/features/doctor/data";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionLink } from "@/components/shared/section-link";
import { QuickLink } from "@/components/shared/quick-link";
import { LinkButton } from "@/components/shared/link-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime } from "@/lib/format";
import { AppointmentStatusControl } from "@/features/doctor/components/appointment-status-control";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("doctor");
  return { title: t("dashboardTitle") };
}

export default async function DoctorDashboard() {
  const [t, tr] = await Promise.all([getTranslations("doctor"), getTranslations("roles")]);
  const { today, pendingReviews, patientCount, displayName } = await getDoctorOverview();
  const doctorName = displayName ?? tr("doctor");

  return (
    <div className="space-y-8">
      <PageHeader
        hero
        title={t("dashboardTitle")}
        description={t("dashboardDesc")}
        actions={
          <LinkButton href="/doctor/schedule">
            <CalendarDays className="size-4" aria-hidden /> {t("openSchedule")}
          </LinkButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("todaysAppointments")} value={today.length} icon={CalendarDays} />
        <StatCard label={t("pendingAiReviews")} value={pendingReviews} icon={Stethoscope} />
        <StatCard label={t("patientsTitle")} value={patientCount} icon={Users} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t("todaysSchedule")}</CardTitle>
          <SectionLink href="/doctor/schedule">{t("fullSchedule")}</SectionLink>
        </CardHeader>
        <CardContent>
          {today.length === 0 ? (
            <EmptyState
              icon={Clock}
              title={t("noAppointmentsTodayTitle")}
              description={t("noAppointmentsTodayDesc")}
            />
          ) : (
            <ul className="divide-y">
              {today.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="tabular-nums text-sm font-medium">
                      {formatTime(a.scheduled_start)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{a.patient?.full_name ?? tr("patient")}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.patient?.patient_code}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={a.status} />
                    <AppointmentStatusControl
                      mode="doctor"
                      appointmentId={a.id}
                      status={a.status}
                      patientId={a.patient?.id ?? a.patient_id}
                      patientName={a.patient?.full_name ?? tr("patient")}
                      patientCode={a.patient?.patient_code}
                      doctorName={doctorName}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <QuickLink
          href="/doctor/reviews"
          title={t("reviewsTitle")}
          description={t("pendingScreenings", { count: pendingReviews })}
          icon={ClipboardList}
        />
        <QuickLink
          href="/doctor/patients"
          title={t("patientsTitle")}
          description={t("browsePatients")}
          icon={Users}
        />
      </div>
    </div>
  );
}
