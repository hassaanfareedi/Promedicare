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
  /** Disable polling (e.g. mobile nav shares desktop poller). */
  pollBadges?: boolean;
};

export function SidebarNav({
  items,
  onNavigate,
  initialBadges = {},
  pendingAppointmentsHref,
  pollBadges = true,
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
    if (!pendingAppointmentsHref || !pollBadges) return;
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void refreshPending();
    };
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [pendingAppointmentsHref, pollBadges, refreshPending]);

  return (
    <nav className="grid gap-1 px-3">
      {items.map((item) => {
        // Exact match when this href is a parent of other nav items (e.g. /patient).
        const hasNestedNavChildren = items.some(
          (other) => other.href !== item.href && other.href.startsWith(`${item.href}/`),
        );
        const active =
          pathname === item.href ||
          (item.href !== "/" &&
            !hasNestedNavChildren &&
            pathname.startsWith(`${item.href}/`));
        const Icon = item.icon;
        const badge = badges[item.href] ?? 0;
        const label =
          badge > 0 ? `${item.label}, ${badge} pending request${badge === 1 ? "" : "s"}` : undefined;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            className={cn(
              "group relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300"
                : "text-muted-foreground hover:translate-x-0.5 hover:bg-muted hover:text-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-teal-500 to-emerald-600 transition-opacity",
                active ? "opacity-100" : "opacity-0",
              )}
            />
            <Icon
              className={cn(
                "size-4 shrink-0 transition-colors",
                active
                  ? "text-teal-600 dark:text-teal-400"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
              aria-hidden
            />
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
