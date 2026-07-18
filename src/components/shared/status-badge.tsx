import { cn } from "@/lib/utils";
import { APPOINTMENT_STATUS_META } from "@/lib/constants";
import type { AppointmentStatus } from "@/types";

export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  const meta = APPOINTMENT_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.tone,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
