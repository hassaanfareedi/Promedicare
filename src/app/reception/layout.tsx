import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/shell/app-shell";
import { getPendingAppointmentRequestCount } from "@/features/reception/data";

export default async function ReceptionLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["receptionist"]);
  const pending = await getPendingAppointmentRequestCount();
  return (
    <AppShell
      user={user}
      navBadges={{ "/reception/appointments": pending }}
      pendingAppointmentsHref="/reception/appointments"
    >
      {children}
    </AppShell>
  );
}
