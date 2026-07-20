import Link from "next/link";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { StaffAppointmentRow } from "@/features/reception/components/staff-appointment-row";
import { APPOINTMENT_STATUS_META } from "@/lib/constants";

export default async function AdminDashboard() {
  const [o, pendingList, confirmedList] = await Promise.all([
    getAdminOverview(),
    getPendingHospitalAppointments(5),
    getConfirmedUpcomingAppointments(5),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        hero
        title="Hospital administration"
        description="Staff, doctors, and operations for your hospital."
        actions={
          <Link href="/admin/analytics" className={buttonVariants({ variant: "outline" })}>
            <BarChart3 className="size-4" aria-hidden /> Analytics
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Doctors" value={o.doctors} icon={BriefcaseMedical} />
        <StatCard label="Staff" value={o.staff} icon={UserCog} />
        <StatCard label="Departments" value={o.departments} icon={Building2} />
        <StatCard label="Patients" value={o.patients} icon={Users} />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Appointments today</CardTitle>
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
            <CardTitle className="text-base">Pending requests</CardTitle>
            <Inbox className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-heading text-3xl font-semibold tabular-nums">{o.pendingRequests}</p>
            <p className="text-sm text-muted-foreground">
              Awaiting confirmation ({APPOINTMENT_STATUS_META.pending.label}).
            </p>
            <Link
              href="/admin/appointments"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Review
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Confirmed upcoming</CardTitle>
            <CalendarCheck className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-heading text-3xl font-semibold tabular-nums">
              {o.confirmedUpcoming}
            </p>
            <p className="text-sm text-muted-foreground">
              Scheduled from now onward ({APPOINTMENT_STATUS_META.confirmed.label}).
            </p>
            <Link
              href="/admin/appointments"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              View
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Latest booking requests</CardTitle>
            <SectionLink href="/admin/appointments">View all</SectionLink>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingList.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No pending requests"
                description="New patient bookings will appear here until confirmed."
              />
            ) : (
              pendingList.map((a) => <StaffAppointmentRow key={a.id} a={a} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Upcoming confirmed</CardTitle>
            <SectionLink href="/admin/appointments">View all</SectionLink>
          </CardHeader>
          <CardContent className="space-y-3">
            {confirmedList.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="No confirmed upcoming"
                description="Confirmed appointments stay visible here until their visit time."
              />
            ) : (
              confirmedList.map((a) => <StaffAppointmentRow key={a.id} a={a} />)
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink href="/admin/doctors" title="Doctors" description="Clinical profiles" icon={BriefcaseMedical} />
        <QuickLink href="/admin/staff" title="Staff" description="Roles & access" icon={UserCog} />
        <QuickLink href="/admin/departments" title="Departments" description="Hospital units" icon={Building2} />
        <QuickLink href="/admin/appointments" title="Appointments" description="All bookings" icon={CalendarDays} />
      </div>
    </div>
  );
}
