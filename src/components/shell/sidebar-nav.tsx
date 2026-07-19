"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/components/shell/nav-config";
import { fetchPendingAppointmentNavBadge } from "@/features/appointments/nav-badges";
import { cn } from "@/lib/utils";

type Props = {
  items: NavItem[];
  onNavigate?: () => void;
  /** Initial badge counts keyed by href (e.g. `/admin/appointments`). */
  initialBadges?: Record<string, number>;
  /** When set, poll pending appointment count into this href every 30s. */
  pendingAppointmentsHref?: string;
};

export function SidebarNav({
  items,
  onNavigate,
  initialBadges = {},
  pendingAppointmentsHref,
}: Props) {
  const pathname = usePathname();
  const [badges, setBadges] = useState<Record<string, number>>(initialBadges);

  useEffect(() => {
    setBadges(initialBadges);
  }, [initialBadges]);

  const refreshPending = useCallback(async () => {
    if (!pendingAppointmentsHref) return;
    try {
      const count = await fetchPendingAppointmentNavBadge();
      setBadges((prev) => ({ ...prev, [pendingAppointmentsHref]: count }));
    } catch {
      // Ignore poll failures (session expired, etc.).
    }
  }, [pendingAppointmentsHref]);

  useEffect(() => {
    if (!pendingAppointmentsHref) return;
    const interval = setInterval(() => void refreshPending(), 30_000);
    return () => clearInterval(interval);
  }, [pendingAppointmentsHref, refreshPending]);

  return (
    <nav className="grid gap-1 px-3">
      {items.map((item) => {
        const active =
          pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
        const Icon = item.icon;
        const badge = badges[item.href] ?? 0;
        const label =
          badge > 0 ? `${item.label}, ${badge} pending request${badge === 1 ? "" : "s"}` : item.label;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {badge > 0 ? (
              <span
                className="inline-flex min-w-5 items-center justify-center rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums"
                aria-hidden
              >
                {badge > 99 ? "99+" : badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
