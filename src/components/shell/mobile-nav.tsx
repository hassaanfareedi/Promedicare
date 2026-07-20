"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/brand/logo";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { SignOutButton } from "@/components/shell/sign-out-button";
import type { NavItem } from "@/components/shell/nav-config";
import { ROLE_HOME, ROLE_LABEL } from "@/lib/constants";
import type { UserRole } from "@/types";

export function MobileNav({
  items,
  role,
  initialBadges,
  pendingAppointmentsHref,
}: {
  items: NavItem[];
  role: UserRole;
  initialBadges?: Record<string, number>;
  pendingAppointmentsHref?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
        }
      />
      <SheetContent side="left" className="flex w-72 flex-col p-0">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center">
            <Link href={ROLE_HOME[role]} onClick={() => setOpen(false)} aria-label="Home">
              <Logo size="sm" />
            </Link>
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-4">
          <p className="px-6 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {ROLE_LABEL[role]}
          </p>
          <SidebarNav
            items={items}
            onNavigate={() => setOpen(false)}
            initialBadges={initialBadges}
            pendingAppointmentsHref={pendingAppointmentsHref}
            pollBadges={false}
          />
        </div>
        <div className="border-t p-3">
          <SignOutButton />
        </div>
      </SheetContent>
    </Sheet>
  );
}
