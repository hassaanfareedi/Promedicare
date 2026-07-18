"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { walkInPatientSchema, type WalkInPatientInput } from "@/schemas/patient";
import { checkInWithFeeSchema, type CheckInWithFeeInput } from "@/schemas/clinical";
import type { MutationResult } from "@/features/patient/actions";

/** Registers a walk-in patient into the staff member's hospital. */
export async function registerWalkIn(
  input: WalkInPatientInput,
): Promise<MutationResult<{ patientId: string; patientCode: string }>> {
  const user = await requireRole(["receptionist", "hospital_admin", "super_admin"]);
  const parsed = walkInPatientSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }
  const v = parsed.data;
  const hospitalId = user.profile.hospital_id;
  if (!hospitalId) {
    return { ok: false, error: "Your account is not linked to a hospital." };
  }
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("patients")
    .insert({
      hospital_id: hospitalId,
      full_name: v.fullName,
      dob: v.dob,
      gender: v.gender,
      phone: v.phone,
      email: v.email || null,
      address: v.address || null,
    })
    .select("id, patient_code")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not register patient." };
  }

  await logAudit({
    action: "patient.walk_in_registered",
    entityType: "patient",
    entityId: data.id,
  });

  revalidatePath("/reception/patients");
  return { ok: true, data: { patientId: data.id, patientCode: data.patient_code } };
}

/** Reception check-in: record fee then set appointment to checked_in. */
export async function checkInWithFee(input: CheckInWithFeeInput): Promise<MutationResult> {
  const user = await requireRole(["receptionist", "hospital_admin"]);
  const parsed = checkInWithFeeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid fee details" };
  }
  const v = parsed.data;
  const hospitalId = user.profile.hospital_id;
  if (!hospitalId) {
    return { ok: false, error: "Your account is not linked to a hospital." };
  }

  const supabase = await createClient();
  const { data: appt, error: apptErr } = await supabase
    .from("appointments")
    .select("id, status, hospital_id")
    .eq("id", v.appointmentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (apptErr) return { ok: false, error: apptErr.message };
  if (!appt) return { ok: false, error: "Appointment not found or not accessible." };
  if (appt.hospital_id !== hospitalId) {
    return { ok: false, error: "Appointment is not in your hospital." };
  }
  if (appt.status !== "confirmed") {
    return { ok: false, error: "Confirm the appointment before check-in." };
  }

  const { data: existingPay } = await supabase
    .from("appointment_payments")
    .select("id")
    .eq("appointment_id", appt.id)
    .maybeSingle();

  if (!existingPay) {
    const { error: payErr } = await supabase.from("appointment_payments").insert({
      appointment_id: appt.id,
      hospital_id: hospitalId,
      amount: v.amount,
      currency: v.currency ?? "PKR",
      method: v.method,
      notes: v.notes || null,
      collected_by: user.id,
    });
    if (payErr) return { ok: false, error: payErr.message };
  }

  const { error: statusErr } = await supabase
    .from("appointments")
    .update({
      status: "checked_in",
      checked_in_at: new Date().toISOString(),
    })
    .eq("id", appt.id);

  if (statusErr) return { ok: false, error: statusErr.message };

  await logAudit({
    action: "appointment.checked_in_with_fee",
    entityType: "appointment",
    entityId: appt.id,
    metadata: { amount: v.amount, method: v.method },
  });

  revalidatePath("/reception/queue");
  revalidatePath("/reception/appointments");
  revalidatePath("/reception");
  revalidatePath("/admin/analytics");
  revalidatePath("/doctor/schedule");
  revalidatePath("/doctor");
  return { ok: true };
}
