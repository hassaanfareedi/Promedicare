import type { Metadata } from "next";
import {
  Activity,
  CalendarDays,
  CalendarPlus,
  ArrowRight,
  Stethoscope,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getPatientOverview } from "@/features/patient/data";
import { PatientAppointmentCard } from "@/features/patient/components/patient-appointment-card";
import { CancelAppointmentButton } from "@/features/appointments/components/cancel-appointment-button";
import { RescheduleDialog } from "@/features/appointments/components/reschedule-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { SectionLink } from "@/components/shared/section-link";
import { LinkButton } from "@/components/shared/link-button";
import { ReliableNavLink } from "@/components/shared/reliable-nav-link";
import { AiDisclaimer } from "@/components/shared/ai-disclaimer";
import { RiskBadge } from "@/components/shared/risk-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { RiskLevel } from "@/types";

const CANCELLABLE = new Set(["pending", "confirmed"]);

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("patient");
  return { title: t("dashboardTitle") };
}

export default async function PatientDashboard() {
  const t = await getTranslations("patient");
  const { upcoming, recentScreenings, stats } = await getPatientOverview();
  const nextVisit = upcoming[0] ?? null;
  const primaryHref = nextVisit ? "/patient/symptom-check" : "/patient/appointments/new";
  const primaryLabel = nextVisit ? t("runScreening") : t("bookCta");
  const PrimaryIcon = nextVisit ? Activity : CalendarPlus;
  const canManageNext = nextVisit && CANCELLABLE.has(nextVisit.status);

  return (
    <div className="space-y-8">
      <PageHeader
        hero
        title={t("dashboardTitle")}
        description={t("dashboardDesc")}
        actions={
          <LinkButton href={primaryHref} className="gap-2">
            <PrimaryIcon className="size-4" aria-hidden />
            {primaryLabel}
          </LinkButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("upcoming")} value={stats.upcomingCount} icon={CalendarDays} />
        <StatCard label={t("totalVisits")} value={stats.totalAppointments} icon={Stethoscope} />
        <StatCard label={t("screeningsTitle")} value={stats.screeningCount} icon={Activity} />
      </div>

      <section aria-labelledby="next-visit-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="next-visit-heading" className="font-heading text-base font-medium">
            {t("nextAppointment")}
          </h2>
          <SectionLink href="/patient/appointments">{t("viewAll")}</SectionLink>
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
            title={t("noUpcomingTitle")}
            description={t("noUpcomingDesc")}
          />
        )}
      </section>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t("recentScreenings")}</CardTitle>
          <SectionLink href="/patient/screenings">{t("viewAll")}</SectionLink>
        </CardHeader>
        <CardContent>
          {recentScreenings.length === 0 ? (
            <EmptyState
              icon={Stethoscope}
              title={t("noScreeningsTitle")}
              description={t("noScreeningsDesc")}
              action={
                <LinkButton href="/patient/symptom-check" size="sm">
                  <Activity className="size-4" aria-hidden /> {t("startNow")}
                </LinkButton>
              }
            />
          ) : (
            <ul className="divide-y">
              {recentScreenings.map((p) => (
                <li key={p.id}>
                  <ReliableNavLink
                    href="/patient/screenings"
                    className="flex min-h-11 items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {p.recommended_specialty_label ?? t("screening")}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {formatDate(p.created_at)}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-2">
                      <RiskBadge level={p.risk_level as RiskLevel} />
                      <ArrowRight className="size-4 text-muted-foreground/60" aria-hidden />
                    </span>
                  </ReliableNavLink>
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
