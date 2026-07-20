import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/shell/app-shell";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["patient"]);
  return <AppShell user={user}>{children}</AppShell>;
}
