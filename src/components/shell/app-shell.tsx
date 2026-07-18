import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { MobileNav } from "@/components/shell/mobile-nav";
import { UserMenu } from "@/components/shell/user-menu";
import { NotificationBell } from "@/components/shell/notification-bell";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { NAV_BY_ROLE } from "@/components/shell/nav-config";
import { ROLE_HOME, ROLE_LABEL } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth/session";

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const role = user.profile.role;
  const items = NAV_BY_ROLE[role];

  return (
    <div className="flex min-h-svh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center border-b px-5">
          <Link href={ROLE_HOME[role]}>
            <Logo size="sm" />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <p className="px-6 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {ROLE_LABEL[role]}
          </p>
          <SidebarNav items={items} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <MobileNav items={items} />
          <div className="lg:hidden">
            <Logo size="sm" iconOnly />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
            <UserMenu fullName={user.profile.full_name} email={user.email} role={role} />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
