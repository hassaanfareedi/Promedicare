import Link from "next/link";
import { CalendarDays, Stethoscope, Users, Clock } from "lucide-react";
import { getDoctorOverview } from "@/features/doctor/data";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime } from "@/lib/format";
import { AppointmentStatusControl } from "@/features/doctor/components/appointment-status-control";

export default async function DoctorDashboard() {
  const { today, pendingReviews, patientCount } = await getDoctorOverview();

  return (
    <div className="space-y-6">
      <PageHeader title="Doctor dashboard" description="Your day at a glance." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Today's appointments" value={today.length} icon={CalendarDays} />
        <StatCard label="Pending AI reviews" value={pendingReviews} icon={Stethoscope} />
        <StatCard label="Patients" value={patientCount} icon={Users} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Today&apos;s schedule</CardTitle>
          <Link href="/doctor/schedule" className="text-sm text-teal-600 hover:underline dark:text-teal-400">
            Full schedule
          </Link>
        </CardHeader>
        <CardContent>
          {today.length === 0 ? (
            <EmptyState icon={Clock} title="No appointments today" description="Enjoy the quieter day." />
          ) : (
            <ul className="divide-y">
              {today.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums text-sm font-medium">{formatTime(a.scheduled_start)}</span>
                    <div>
                      <p className="font-medium">{a.patient?.full_name ?? "Patient"}</p>
                      <p className="text-xs text-muted-foreground">{a.patient?.patient_code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={a.status} />
                    <AppointmentStatusControl appointmentId={a.id} status={a.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
