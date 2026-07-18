import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/shell/app-shell";

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["doctor"]);
  return <AppShell user={user}>{children}</AppShell>;
}
