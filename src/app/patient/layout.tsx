import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/shell/app-shell";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["patient"]);
  return (
    <AppShell user={user}>
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-6 -z-10 h-56 bg-[radial-gradient(ellipse_at_top,_oklch(0.94_0.04_186)_0%,_transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,_oklch(0.28_0.04_186)_0%,_transparent_70%)]"
        />
        {children}
      </div>
    </AppShell>
  );
}
