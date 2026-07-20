import type { Metadata } from "next";
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
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { SectionLink } from "@/components/shared/section-link";
import { AiDisclaimer } from "@/components/shared/ai-disclaimer";
import { RiskBadge } from "@/components/shared/risk-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

const CANCELLABLE = new Set(["pending", "confirmed"]);

export const metadata: Metadata = { title: "Patient dashboard" };

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
      <PageHeader
        hero
        title={`Welcome back, ${firstName}`}
        description={
          nextVisit
            ? "Your next visit is below. Check symptoms anytime if you need guidance before you go."
            : "Start with a symptom check or book a visit with a specialist."
        }
        actions={
          <Link href={primaryHref} className={cn(buttonVariants(), "gap-2")}>
            <PrimaryIcon className="size-4" aria-hidden />
            {primaryLabel}
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Upcoming" value={stats.upcomingCount} icon={CalendarDays} />
        <StatCard label="Total visits" value={stats.totalAppointments} icon={Stethoscope} />
        <StatCard label="Screenings" value={stats.screeningCount} icon={Activity} />
      </div>

      <section aria-labelledby="next-visit-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="next-visit-heading" className="font-heading text-base font-medium">
            Next appointment
          </h2>
          <SectionLink href="/patient/appointments">View all</SectionLink>
        </div>
        {nextVisit ? (
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
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming appointments"
            description="Use Book a visit above when you are ready, or run a symptom check first."
          />
        )}
      </section>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Recent screenings</CardTitle>
          <SectionLink href="/patient/screenings">View all</SectionLink>
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
                    className="flex min-h-11 items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {p.recommended_specialty_label ?? "Screening"}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {formatDate(p.created_at)}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-2">
                      <RiskBadge level={p.risk_level as RiskLevel} />
                      <ArrowRight className="size-4 text-muted-foreground/60" aria-hidden />
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
