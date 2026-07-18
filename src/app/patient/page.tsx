import Link from "next/link";
import { Activity, CalendarDays, ClipboardList, CalendarPlus, ArrowRight, Stethoscope } from "lucide-react";
import { getPatientOverview } from "@/features/patient/data";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { AiDisclaimer } from "@/components/shared/ai-disclaimer";
import { RiskBadge } from "@/components/shared/risk-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatDateTime, formatDate, formatDoctorName } from "@/lib/format";
import type { RiskLevel } from "@/types";

export default async function PatientDashboard() {
  const { patient, upcoming, recentScreenings, stats } = await getPatientOverview();
  const firstName = patient?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Track your screenings and appointments in one place."
        actions={
          <Link href="/patient/symptom-check" className={buttonVariants({ size: "sm" })}>
            <Activity className="size-4" /> Symptom check
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Upcoming appointments" value={stats.upcomingCount} icon={CalendarDays} />
        <StatCard label="Total appointments" value={stats.totalAppointments} icon={CalendarPlus} />
        <StatCard label="AI screenings" value={stats.screeningCount} icon={ClipboardList} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Upcoming appointments</CardTitle>
            <Link
              href="/patient/appointments"
              className="text-sm text-teal-600 hover:underline dark:text-teal-400"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming appointments"
                description="Book a visit with a specialist to get started."
                action={
                  <Link href="/patient/appointments/new" className={buttonVariants({ size: "sm" })}>
                    <CalendarPlus className="size-4" /> Book appointment
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y">
                {upcoming.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {a.doctorName ? formatDoctorName(a.doctorName) : "Doctor to be assigned"}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {formatDateTime(a.scheduled_start)}
                        {a.specialtyName ? ` · ${a.specialtyName}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent screenings</CardTitle>
            <Link
              href="/patient/screenings"
              className="text-sm text-teal-600 hover:underline dark:text-teal-400"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentScreenings.length === 0 ? (
              <EmptyState
                icon={Stethoscope}
                title="No screenings yet"
                description="Run an AI symptom check to see your risk assessment."
                action={
                  <Link href="/patient/symptom-check" className={buttonVariants({ size: "sm" })}>
                    <Activity className="size-4" /> Start now
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y">
                {recentScreenings.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {p.recommended_specialty_label ?? "Screening"}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">{formatDate(p.created_at)}</p>
                    </div>
                    <RiskBadge level={p.risk_level as RiskLevel} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-teal-100 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/10">
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-medium">Not feeling well?</h3>
            <p className="text-sm text-muted-foreground">
              Run a quick AI symptom check and we&apos;ll suggest the right specialist.
            </p>
          </div>
          <Link href="/patient/symptom-check" className={buttonVariants()}>
            Start symptom check <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>

      <AiDisclaimer />
    </div>
  );
}
