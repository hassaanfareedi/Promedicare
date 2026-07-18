"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/brand/logo";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { SignOutButton } from "@/components/shell/sign-out-button";
import type { NavItem } from "@/components/shell/nav-config";

export function MobileNav({ items }: { items: NavItem[] }) {
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
            <Logo size="sm" />
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav items={items} onNavigate={() => setOpen(false)} />
        </div>
        <div className="border-t p-3">
          <SignOutButton />
        </div>
      </SheetContent>
    </Sheet>
  );
}
