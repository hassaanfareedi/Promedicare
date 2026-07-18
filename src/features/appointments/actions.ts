"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import {
  bookAppointmentSchema,
  cancelAppointmentSchema,
  type BookAppointmentInput,
  type CancelAppointmentInput,
} from "@/schemas/appointment";
import { buildSlots, type SlotGroup } from "@/features/appointments/slots";
import type { MutationResult } from "@/features/patient/actions";

/** Candidate booking slots for a doctor over the next two weeks. */
export async function getDoctorSlots(doctorId: string): Promise<SlotGroup[]> {
  await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("doctor_availability")
    .select("*")
    .eq("doctor_id", doctorId)
    .eq("is_active", true);
  return buildSlots(data ?? []);
}

/** Books an appointment through the transactional, conflict-safe DB function. */
export async function bookAppointment(
  input: BookAppointmentInput,
): Promise<MutationResult<{ appointmentId: string }>> {
  await requireUser();
  const parsed = bookAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid booking details" };
  }
  const v = parsed.data;
  const supabase = await createClient();

  const { data: appointmentId, error } = await supabase.rpc("book_appointment", {
    p_hospital: v.hospitalId,
    p_doctor: v.doctorId,
    p_department: v.departmentId ?? undefined,
    p_start: v.scheduledStart,
    p_reason: v.reason || undefined,
    p_prediction: v.predictionId ?? undefined,
  });

  if (error || !appointmentId) {
    return { ok: false, error: error?.message ?? "Could not book this appointment." };
  }

  // Notify the assigned doctor (best-effort). Patients may read active doctor rows.
  const { data: doctor } = await supabase
    .from("doctors")
    .select("profile_id")
    .eq("id", v.doctorId)
    .maybeSingle();
  if (doctor?.profile_id) {
    await notify({
      recipientId: doctor.profile_id,
      type: "appointment_booked",
      title: "New appointment booked",
      body: "A patient has booked an appointment with you.",
      data: { appointmentId },
    });
  }

  await logAudit({
    action: "appointment.booked",
    entityType: "appointment",
    entityId: appointmentId,
    metadata: { hospitalId: v.hospitalId, doctorId: v.doctorId },
  });

  revalidatePath("/patient/appointments");
  revalidatePath("/patient");
  return { ok: true, data: { appointmentId } };
}

/** Patient-initiated cancellation of their own appointment. */
export async function cancelAppointment(
  input: CancelAppointmentInput,
): Promise<MutationResult> {
  await requireUser();
  const parsed = cancelAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" };
  }
  const supabase = await createClient();

  const { data: appt, error } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_reason: parsed.data.reason || null,
    })
    .eq("id", parsed.data.appointmentId)
    .in("status", ["pending", "confirmed"])
    .select("id, doctor_id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!appt) return { ok: false, error: "This appointment can no longer be cancelled." };

  await logAudit({
    action: "appointment.cancelled",
    entityType: "appointment",
    entityId: appt.id,
  });

  revalidatePath("/patient/appointments");
  revalidatePath("/patient");
  return { ok: true };
}
