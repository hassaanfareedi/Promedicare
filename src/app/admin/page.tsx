import Link from "next/link";
import {
  BriefcaseMedical,
  UserCog,
  Building2,
  Users,
  CalendarDays,
  Inbox,
  CalendarCheck,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { StaffAppointmentRow } from "@/features/reception/components/staff-appointment-row";
import { APPOINTMENT_STATUS_META } from "@/lib/constants";

const LINKS = [
  { href: "/admin/doctors", label: "Manage doctors", icon: BriefcaseMedical },
  { href: "/admin/staff", label: "Manage staff", icon: UserCog },
  { href: "/admin/departments", label: "Departments", icon: Building2 },
  { href: "/admin/appointments", label: "Appointments", icon: CalendarDays },
];

export default async function AdminDashboard() {
  const [o, pendingList, confirmedList] = await Promise.all([
    getAdminOverview(),
    getPendingHospitalAppointments(5),
    getConfirmedUpcomingAppointments(5),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Hospital administration" description="Manage your hospital's staff, doctors and operations." />

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
            <span className="text-2xl font-semibold tabular-nums">{o.appointmentsToday}</span>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {o.todayByStatus.map(({ status, count }) => (
                <li
                  key={status}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
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
          <CardContent className="space-y-4">
            <p className="text-3xl font-semibold tabular-nums">{o.pendingRequests}</p>
            <p className="text-sm text-muted-foreground">
              Booking requests awaiting confirmation ({APPOINTMENT_STATUS_META.pending.label}).
            </p>
            <Link href="/admin/appointments" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Review appointments
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Confirmed upcoming</CardTitle>
            <CalendarCheck className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-semibold tabular-nums">{o.confirmedUpcoming}</p>
            <p className="text-sm text-muted-foreground">
              Confirmed visits scheduled from now onward ({APPOINTMENT_STATUS_META.confirmed.label}).
            </p>
            <Link href="/admin/appointments" className={buttonVariants({ variant: "outline", size: "sm" })}>
              View appointments
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Latest booking requests</CardTitle>
            <Link
              href="/admin/appointments"
              className="text-sm text-teal-600 hover:underline dark:text-teal-400"
            >
              View all
            </Link>
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
            <Link
              href="/admin/appointments"
              className="text-sm text-teal-600 hover:underline dark:text-teal-400"
            >
              View all
            </Link>
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

      <Card>
        <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:border-teal-500 hover:bg-accent"
            >
              <span className="grid size-10 place-items-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/50">
                <l.icon className="size-5" />
              </span>
              <span className="font-medium">{l.label}</span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Link href="/admin/analytics" className={buttonVariants({ variant: "outline" })}>
          View analytics
        </Link>
      </div>
    </div>
  );
}
