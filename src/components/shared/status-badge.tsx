"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getAppointmentStatusTone } from "@/lib/constants";
import type { AppointmentStatus } from "@/types";

export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  const t = useTranslations("status");
  const key = (status in { pending: 1, confirmed: 1, checked_in: 1, in_progress: 1, completed: 1, cancelled: 1, no_show: 1 }
    ? status
    : "unknown") as AppointmentStatus | "unknown";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        getAppointmentStatusTone(status),
        className,
      )}
    >
      {t(key)}
    </span>
  );
}
