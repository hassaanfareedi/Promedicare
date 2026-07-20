import Link from "next/link";
import { CalendarDays, Stethoscope, Users, Clock, ClipboardList } from "lucide-react";
import { getDoctorOverview } from "@/features/doctor/data";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionLink } from "@/components/shared/section-link";
import { QuickLink } from "@/components/shared/quick-link";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatTime } from "@/lib/format";
import { AppointmentStatusControl } from "@/features/doctor/components/appointment-status-control";

export default async function DoctorDashboard() {
  const { today, pendingReviews, patientCount, displayName } = await getDoctorOverview();
  const doctorName = displayName ?? "Doctor";
  const firstName = displayName?.split(" ")[0] ?? "Doctor";

  return (
    <div className="space-y-8">
      <PageHeader
        hero
        title={`Good day, ${firstName}`}
        description="Your schedule and reviews for today."
        actions={
          <Link href="/doctor/schedule" className={buttonVariants()}>
            <CalendarDays className="size-4" aria-hidden /> Open schedule
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Today's appointments" value={today.length} icon={CalendarDays} />
        <StatCard label="Pending AI reviews" value={pendingReviews} icon={Stethoscope} />
        <StatCard label="Patients" value={patientCount} icon={Users} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Today&apos;s schedule</CardTitle>
          <SectionLink href="/doctor/schedule">Full schedule</SectionLink>
        </CardHeader>
        <CardContent>
          {today.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No appointments today"
              description="Enjoy the quieter day — reviews may still be waiting."
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
                      <p className="truncate font-medium">{a.patient?.full_name ?? "Patient"}</p>
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
                      patientName={a.patient?.full_name ?? "Patient"}
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
          title="AI reviews"
          description={`${pendingReviews} pending screening${pendingReviews === 1 ? "" : "s"}`}
          icon={ClipboardList}
        />
        <QuickLink
          href="/doctor/patients"
          title="Patients"
          description="Browse patients assigned to you"
          icon={Users}
        />
      </div>
    </div>
  );
}
