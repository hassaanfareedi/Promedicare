"use server";

import { requireRole } from "@/lib/auth/session";
import { getPendingAppointmentRequestCount } from "@/features/reception/data";

/** Pending appointment request count for Admin / Reception nav badges. */
export async function fetchPendingAppointmentNavBadge(): Promise<number> {
  await requireRole(["hospital_admin", "receptionist"]);
  return getPendingAppointmentRequestCount();
}
