import type { AppointmentStatus } from "@/types";

/**
 * Operational status machine (matches reception/doctor UI + DB guard).
 * Terminal statuses cannot leave; in_progress only completes (fee path requires
 * checked_in before start).
 */
const ALLOWED: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  pending: ["confirmed", "cancelled", "no_show"],
  confirmed: ["checked_in", "cancelled", "no_show"],
  checked_in: ["in_progress", "cancelled", "no_show"],
  in_progress: ["completed"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function canTransitionAppointmentStatus(
  from: AppointmentStatus,
  to: AppointmentStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED[from]?.includes(to) ?? false;
}
