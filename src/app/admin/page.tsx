import Link from "next/link";
import { BriefcaseMedical, UserCog, Building2, Users, CalendarDays } from "lucide-react";
import { getAdminOverview } from "@/features/admin/data";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

const LINKS = [
  { href: "/admin/doctors", label: "Manage doctors", icon: BriefcaseMedical },
  { href: "/admin/staff", label: "Manage staff", icon: UserCog },
  { href: "/admin/departments", label: "Departments", icon: Building2 },
  { href: "/admin/appointments", label: "Appointments", icon: CalendarDays },
];

export default async function AdminDashboard() {
  const o = await getAdminOverview();

  return (
    <div className="space-y-6">
      <PageHeader title="Hospital administration" description="Manage your hospital's staff, doctors and operations." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Doctors" value={o.doctors} icon={BriefcaseMedical} />
        <StatCard label="Staff" value={o.staff} icon={UserCog} />
        <StatCard label="Departments" value={o.departments} icon={Building2} />
        <StatCard label="Patients" value={o.patients} icon={Users} />
      </div>

      <StatCard label="Appointments today" value={o.appointmentsToday} icon={CalendarDays} />

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

      <div className="flex justify-end">
        <Link href="/admin/analytics" className={buttonVariants({ variant: "outline" })}>
          View analytics
        </Link>
      </div>
    </div>
  );
}
