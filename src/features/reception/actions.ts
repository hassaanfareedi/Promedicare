"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { walkInPatientSchema, type WalkInPatientInput } from "@/schemas/patient";
import { checkInWithFeeSchema, type CheckInWithFeeInput } from "@/schemas/clinical";
import type { MutationResult } from "@/features/patient/actions";

/** Registers a walk-in patient and books them into today's queue. */
export async function registerWalkIn(
  input: WalkInPatientInput,
): Promise<MutationResult<{ patientId: string; patientCode: string; appointmentId: string }>> {
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

  const start = new Date(v.scheduledStart);
  if (Number.isNaN(start.getTime())) {
    return { ok: false, error: "Enter a valid visit time." };
  }

  const { data: doctor, error: doctorErr } = await supabase
    .from("doctors")
    .select("id, hospital_id, department_id, is_active")
    .eq("id", v.doctorId)
    .is("deleted_at", null)
    .maybeSingle();

  if (doctorErr) return { ok: false, error: doctorErr.message };
  if (!doctor || !doctor.is_active || doctor.hospital_id !== hospitalId) {
    return { ok: false, error: "Selected doctor is not available at this hospital." };
  }

  const { data: availability } = await supabase
    .from("doctor_availability")
    .select("slot_minutes")
    .eq("doctor_id", doctor.id)
    .eq("is_active", true)
    .order("slot_minutes", { ascending: true })
    .limit(1)
    .maybeSingle();

  const slotMinutes = availability?.slot_minutes ?? 30;
  const end = new Date(start.getTime() + slotMinutes * 60_000);

  const { data: patient, error: patientErr } = await supabase
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

  if (patientErr || !patient) {
    return { ok: false, error: patientErr?.message ?? "Could not register patient." };
  }

  const { data: appointment, error: apptErr } = await supabase
    .from("appointments")
    .insert({
      hospital_id: hospitalId,
      patient_id: patient.id,
      doctor_id: doctor.id,
      department_id: doctor.department_id,
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      status: "confirmed",
      source: "walk_in",
      reason: v.reason || "Walk-in visit",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (apptErr || !appointment) {
    await supabase.from("patients").update({ deleted_at: new Date().toISOString() }).eq("id", patient.id);
    return {
      ok: false,
      error:
        apptErr?.code === "23P01"
          ? "That time overlaps another visit for this doctor. Choose a different time."
          : (apptErr?.message ?? "Patient registered but the visit could not be booked."),
    };
  }

  await logAudit({
    action: "patient.walk_in_registered",
    entityType: "patient",
    entityId: patient.id,
    metadata: { appointmentId: appointment.id, doctorId: doctor.id },
  });

  revalidatePath("/reception/patients");
  revalidatePath("/reception");
  revalidatePath("/reception/queue");
  revalidatePath("/reception/appointments");
  revalidatePath("/doctor/schedule");
  revalidatePath("/doctor");
  return {
    ok: true,
    data: {
      patientId: patient.id,
      patientCode: patient.patient_code,
      appointmentId: appointment.id,
    },
  };
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

  if (existingPay) {
    const { error: payErr } = await supabase
      .from("appointment_payments")
      .update({
        amount: v.amount,
        currency: v.currency ?? "PKR",
        method: v.method,
        notes: v.notes || null,
        collected_by: user.id,
      })
      .eq("id", existingPay.id);
    if (payErr) return { ok: false, error: payErr.message };
  } else {
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
