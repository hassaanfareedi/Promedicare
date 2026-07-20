import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Users,
  BriefcaseMedical,
  CalendarDays,
  Activity,
  Stethoscope,
  ScrollText,
} from "lucide-react";
import { getPlatformOverview } from "@/features/platform/data";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { QuickLink } from "@/components/shared/quick-link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Platform" };

export default async function PlatformDashboard() {
  const o = await getPlatformOverview();

  return (
    <div className="space-y-8">
      <PageHeader
        hero
        title="Platform overview"
        description="System-wide view across all hospitals."
        actions={
          <Link href="/platform/hospitals" className={buttonVariants()}>
            <Building2 className="size-4" aria-hidden /> Manage hospitals
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Hospitals" value={o.hospitals} icon={Building2} />
        <StatCard label="Users" value={o.users} icon={Users} />
        <StatCard label="Doctors" value={o.doctors} icon={BriefcaseMedical} />
        <StatCard label="Patients" value={o.patients} icon={Users} />
        <StatCard label="Appointments" value={o.appointments} icon={CalendarDays} />
        <StatCard label="AI screenings" value={o.predictions} icon={Activity} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink
          href="/platform/hospitals"
          title="Hospitals"
          description="Onboard and activate sites"
          icon={Building2}
        />
        <QuickLink
          href="/platform/specialties"
          title="Specialties"
          description="Clinical specialty catalog"
          icon={Stethoscope}
        />
        <QuickLink
          href="/platform/analytics"
          title="Analytics"
          description="Cross-hospital metrics"
          icon={Activity}
        />
        <QuickLink
          href="/platform/audit"
          title="Audit logs"
          description="Security and change trail"
          icon={ScrollText}
        />
      </div>
    </div>
  );
}
