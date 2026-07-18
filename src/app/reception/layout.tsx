import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/shell/app-shell";

export default async function ReceptionLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["receptionist"]);
  return <AppShell user={user}>{children}</AppShell>;
}
