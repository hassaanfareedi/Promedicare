import type { Metadata } from "next";
import {
  Building2,
  Users,
  BriefcaseMedical,
  CalendarDays,
  Activity,
  Stethoscope,
  ScrollText,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getPlatformOverview } from "@/features/platform/data";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { QuickLink } from "@/components/shared/quick-link";
import { LinkButton } from "@/components/shared/link-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("platform");
  return { title: t("dashboardTitle") };
}

export default async function PlatformDashboard() {
  const t = await getTranslations("platform");
  const o = await getPlatformOverview();

  return (
    <div className="space-y-8">
      <PageHeader
        hero
        title={t("dashboardTitle")}
        description={t("dashboardDesc")}
        actions={
          <LinkButton href="/platform/hospitals">
            <Building2 className="size-4" aria-hidden /> {t("manageHospitals")}
          </LinkButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label={t("hospitalsTitle")} value={o.hospitals} icon={Building2} />
        <StatCard label={t("users")} value={o.users} icon={Users} />
        <StatCard label={t("doctorsTitle")} value={o.doctors} icon={BriefcaseMedical} />
        <StatCard label={t("patients")} value={o.patients} icon={Users} />
        <StatCard label={t("appointments")} value={o.appointments} icon={CalendarDays} />
        <StatCard label={t("aiScreenings")} value={o.predictions} icon={Activity} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink
          href="/platform/hospitals"
          title={t("hospitalsTitle")}
          description={t("quickHospitalsDesc")}
          icon={Building2}
        />
        <QuickLink
          href="/platform/specialties"
          title={t("specialtiesTitle")}
          description={t("quickSpecialtiesDesc")}
          icon={Stethoscope}
        />
        <QuickLink
          href="/platform/analytics"
          title={t("analyticsTitle")}
          description={t("quickAnalyticsDesc")}
          icon={Activity}
        />
        <QuickLink
          href="/platform/audit"
          title={t("auditTitle")}
          description={t("quickAuditDesc")}
          icon={ScrollText}
        />
      </div>
    </div>
  );
}
