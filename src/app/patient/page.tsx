import Link from "next/link";
import {
  Activity,
  CalendarDays,
  CalendarPlus,
  ArrowRight,
  Stethoscope,
} from "lucide-react";
import { getPatientOverview } from "@/features/patient/data";
import { PatientAppointmentCard } from "@/features/patient/components/patient-appointment-card";
import { CancelAppointmentButton } from "@/features/appointments/components/cancel-appointment-button";
import { RescheduleDialog } from "@/features/appointments/components/reschedule-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { AiDisclaimer } from "@/components/shared/ai-disclaimer";
import { RiskBadge } from "@/components/shared/risk-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

const CANCELLABLE = new Set(["pending", "confirmed"]);

export default async function PatientDashboard() {
  const { displayName, upcoming, recentScreenings, stats } = await getPatientOverview();
  const firstName = displayName?.split(" ")[0] ?? "there";
  const nextVisit = upcoming[0] ?? null;
  const primaryHref = nextVisit ? "/patient/symptom-check" : "/patient/appointments/new";
  const primaryLabel = nextVisit ? "Check symptoms" : "Book a visit";
  const PrimaryIcon = nextVisit ? Activity : CalendarPlus;
  const canManageNext = nextVisit && CANCELLABLE.has(nextVisit.status);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
            Welcome back, {firstName}
          </h1>
          <p className="max-w-xl text-pretty text-sm text-foreground/70 sm:text-base">
            {nextVisit
              ? "Your next visit is below. Check symptoms anytime if you need guidance before you go."
              : "Start with a symptom check or book a visit with a specialist."}
          </p>
        </div>
        <Link
          href={primaryHref}
          className={cn(buttonVariants({ size: "default" }), "shrink-0 gap-2 self-start sm:self-auto")}
        >
          <PrimaryIcon className="size-4" aria-hidden />
          {primaryLabel}
        </Link>
      </header>

      {nextVisit ? (
        <section aria-labelledby="next-visit-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="next-visit-heading" className="sr-only">
              Next appointment
            </h2>
            <Link
              href="/patient/appointments"
              className="ml-auto text-sm font-medium text-teal-700 underline-offset-4 hover:underline dark:text-teal-400"
            >
              View all appointments
            </Link>
          </div>
          <PatientAppointmentCard
            appointment={nextVisit}
            featured
            actions={
              canManageNext ? (
                <>
                  <RescheduleDialog appointmentId={nextVisit.id} doctorId={nextVisit.doctor_id} />
                  <CancelAppointmentButton appointmentId={nextVisit.id} />
                </>
              ) : undefined
            }
          />
        </section>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-2">
            <EmptyState
              icon={CalendarDays}
              title="No upcoming appointments"
              description="Use Book a visit above when you are ready, or run a symptom check first."
            />
          </CardContent>
        </Card>
      )}

      <dl className="grid grid-cols-3 divide-x overflow-hidden rounded-xl border bg-card text-center">
        <div className="px-3 py-3.5 sm:px-4 sm:py-4">
          <dt className="text-xs font-medium text-foreground/65 sm:text-sm">Upcoming</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">{stats.upcomingCount}</dd>
        </div>
        <div className="px-3 py-3.5 sm:px-4 sm:py-4">
          <dt className="text-xs font-medium text-foreground/65 sm:text-sm">Total visits</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">{stats.totalAppointments}</dd>
        </div>
        <div className="px-3 py-3.5 sm:px-4 sm:py-4">
          <dt className="text-xs font-medium text-foreground/65 sm:text-sm">Screenings</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">{stats.screeningCount}</dd>
        </div>
      </dl>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Recent screenings</CardTitle>
          <Link
            href="/patient/screenings"
            className="text-sm font-medium text-teal-700 underline-offset-4 hover:underline dark:text-teal-400"
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
                  <Activity className="size-4" aria-hidden /> Start now
                </Link>
              }
            />
          ) : (
            <ul className="divide-y">
              {recentScreenings.map((p) => (
                <li key={p.id}>
                  <Link
                    href="/patient/screenings"
                    className="flex min-h-11 items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {p.recommended_specialty_label ?? "Screening"}
                      </p>
                      <p className="truncate text-sm text-foreground/65">{formatDate(p.created_at)}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-2">
                      <RiskBadge level={p.risk_level as RiskLevel} />
                      <ArrowRight className="size-4 text-foreground/40" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AiDisclaimer />
    </div>
  );
}
