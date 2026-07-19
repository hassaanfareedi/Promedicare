import Link from "next/link";
import { CalendarDays, Users, UserCheck, Clock, CalendarPlus } from "lucide-react";
import { getReceptionOverview, getWalkInDoctors } from "@/features/reception/data";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { StaffAppointmentRow } from "@/features/reception/components/staff-appointment-row";
import { WalkInDialog } from "@/features/reception/components/walk-in-dialog";

export default async function ReceptionDashboard() {
  const [{ today, waiting, patientCount }, doctors] = await Promise.all([
    getReceptionOverview(),
    getWalkInDoctors(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Front desk"
        description="Manage today's queue and patient registrations."
        actions={
          <>
            <Link
              href="/reception/appointments/new"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <CalendarPlus className="size-4" aria-hidden /> Book appointment
            </Link>
            <WalkInDialog doctors={doctors} />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Today's appointments" value={today.length} icon={CalendarDays} />
        <StatCard label="Currently waiting" value={waiting} icon={UserCheck} />
        <StatCard label="Patients" value={patientCount} icon={Users} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Today&apos;s queue</CardTitle>
          <Link href="/reception/queue" className="text-sm text-teal-600 hover:underline dark:text-teal-400">
            Open queue
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {today.length === 0 ? (
            <EmptyState icon={Clock} title="No appointments today" description="Registered walk-ins and bookings appear here." />
          ) : (
            today.slice(0, 6).map((a) => <StaffAppointmentRow key={a.id} a={a} allowReschedule={false} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
