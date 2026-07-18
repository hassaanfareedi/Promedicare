import Link from "next/link";
import { Building2, Users, BriefcaseMedical, CalendarDays, Activity, Stethoscope } from "lucide-react";
import { getPlatformOverview } from "@/features/platform/data";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent } from "@/components/ui/card";

const LINKS = [
  { href: "/platform/hospitals", label: "Hospitals", icon: Building2 },
  { href: "/platform/specialties", label: "Specialties", icon: Stethoscope },
  { href: "/platform/analytics", label: "Analytics", icon: Activity },
  { href: "/platform/audit", label: "Audit logs", icon: CalendarDays },
];

export default async function PlatformDashboard() {
  const o = await getPlatformOverview();

  return (
    <div className="space-y-6">
      <PageHeader title="Platform overview" description="System-wide view across all hospitals." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Hospitals" value={o.hospitals} icon={Building2} />
        <StatCard label="Users" value={o.users} icon={Users} />
        <StatCard label="Doctors" value={o.doctors} icon={BriefcaseMedical} />
        <StatCard label="Patients" value={o.patients} icon={Users} />
        <StatCard label="Appointments" value={o.appointments} icon={CalendarDays} />
        <StatCard label="AI screenings" value={o.predictions} icon={Activity} />
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
    </div>
  );
}
