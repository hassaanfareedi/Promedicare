import type { Metadata } from "next";
import {
  BriefcaseMedical,
  UserCog,
  Building2,
  Users,
  CalendarDays,
  Inbox,
  CalendarCheck,
  BarChart3,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getAdminOverview } from "@/features/admin/data";
import {
  getPendingHospitalAppointments,
  getConfirmedUpcomingAppointments,
} from "@/features/reception/data";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionLink } from "@/components/shared/section-link";
import { QuickLink } from "@/components/shared/quick-link";
import { LinkButton } from "@/components/shared/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaffAppointmentRow } from "@/features/reception/components/staff-appointment-row";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("dashboardTitle") };
}

export default async function AdminDashboard() {
  const t = await getTranslations("admin");
  const ts = await getTranslations("status");
  const [o, pendingList, confirmedList] = await Promise.all([
    getAdminOverview(),
    getPendingHospitalAppointments(5),
    getConfirmedUpcomingAppointments(5),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        hero
        title={t("dashboardTitle")}
        description={t("dashboardDesc")}
        actions={
          <LinkButton href="/admin/analytics" variant="outline">
            <BarChart3 className="size-4" aria-hidden /> {t("analyticsTitle")}
          </LinkButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("doctorsTitle")} value={o.doctors} icon={BriefcaseMedical} />
        <StatCard label={t("staffTitle")} value={o.staff} icon={UserCog} />
        <StatCard label={t("departmentsTitle")} value={o.departments} icon={Building2} />
        <StatCard label={t("patients")} value={o.patients} icon={Users} />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t("appointmentsToday")}</CardTitle>
            <span className="font-heading text-2xl font-semibold tabular-nums">
              {o.appointmentsToday}
            </span>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {o.todayByStatus.map(({ status, count }) => (
                <li
                  key={status}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 px-3 py-2 text-sm"
                >
                  <StatusBadge status={status} />
                  <span className="tabular-nums font-medium text-muted-foreground">{count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t("pendingRequests")}</CardTitle>
            <Inbox className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-heading text-3xl font-semibold tabular-nums">{o.pendingRequests}</p>
            <p className="text-sm text-muted-foreground">
              {t("awaitingConfirmation", { status: ts("pending") })}
            </p>
            <LinkButton href="/admin/appointments" variant="outline" size="sm">
              {t("review")}
            </LinkButton>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t("confirmedUpcoming")}</CardTitle>
            <CalendarCheck className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-heading text-3xl font-semibold tabular-nums">
              {o.confirmedUpcoming}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("scheduledFromNow", { status: ts("confirmed") })}
            </p>
            <LinkButton href="/admin/appointments" variant="outline" size="sm">
              {t("view")}
            </LinkButton>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t("latestBookingRequests")}</CardTitle>
            <SectionLink href="/admin/appointments">{t("viewAll")}</SectionLink>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingList.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title={t("noPendingRequests")}
                description={t("noPendingRequestsDesc")}
              />
            ) : (
              pendingList.map((a) => <StaffAppointmentRow key={a.id} a={a} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t("upcomingConfirmed")}</CardTitle>
            <SectionLink href="/admin/appointments">{t("viewAll")}</SectionLink>
          </CardHeader>
          <CardContent className="space-y-3">
            {confirmedList.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title={t("noConfirmedUpcoming")}
                description={t("noConfirmedUpcomingDesc")}
              />
            ) : (
              confirmedList.map((a) => <StaffAppointmentRow key={a.id} a={a} />)
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink href="/admin/doctors" title={t("doctorsTitle")} description={t("quickDoctorsDesc")} icon={BriefcaseMedical} />
        <QuickLink href="/admin/staff" title={t("staffTitle")} description={t("quickStaffDesc")} icon={UserCog} />
        <QuickLink href="/admin/departments" title={t("departmentsTitle")} description={t("quickDepartmentsDesc")} icon={Building2} />
        <QuickLink href="/admin/appointments" title={t("appointmentsTitle")} description={t("quickAppointmentsDesc")} icon={CalendarDays} />
      </div>
    </div>
  );
}
