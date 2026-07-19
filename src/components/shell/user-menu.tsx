"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton } from "@/components/shell/sign-out-button";
import { ROLE_LABEL, ROLE_SETTINGS } from "@/lib/constants";
import type { UserRole } from "@/types";

function initials(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.split("@")[0] || "U";
  const parts = source.split(/\s+/);
  return (parts[0]?.[0] ?? "U").concat(parts[1]?.[0] ?? "").toUpperCase();
}

export function UserMenu({
  fullName,
  email,
  role,
}: {
  fullName: string | null;
  email: string | null;
  role: UserRole;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-9 gap-2 pl-1.5 pr-2.5"
            aria-label="Account menu"
          />
        }
      >
        <Avatar className="size-7">
          <AvatarFallback className="bg-teal-100 text-xs text-teal-700 dark:bg-teal-900 dark:text-teal-200">
            {initials(fullName, email)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
          {fullName ?? email ?? "Account"}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate text-sm text-foreground">{fullName ?? "Account"}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">{email}</span>
            <span className="mt-1 text-xs font-normal text-teal-600 dark:text-teal-400">
              {ROLE_LABEL[role]}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href={ROLE_SETTINGS[role]} />}>
            <Settings className="size-4" aria-hidden />
            {role === "patient" ? "Profile" : "Settings"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <SignOutButton asMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
