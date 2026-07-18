import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/shell/app-shell";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["super_admin"]);
  return <AppShell user={user}>{children}</AppShell>;
}
