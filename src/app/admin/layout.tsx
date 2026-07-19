import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/shell/app-shell";
import { getPendingAppointmentRequestCount } from "@/features/reception/data";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["hospital_admin"]);
  const pending = await getPendingAppointmentRequestCount();
  return (
    <AppShell
      user={user}
      navBadges={{ "/admin/appointments": pending }}
      pendingAppointmentsHref="/admin/appointments"
    >
      {children}
    </AppShell>
  );
}
