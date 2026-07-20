"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { predictionReviewSchema, type PredictionReviewInput, clinicalBriefSchema, type ClinicalBrief } from "@/schemas/prediction";
import {
  updateAppointmentStatusSchema,
  type UpdateAppointmentStatusInput,
} from "@/schemas/appointment";
import {
  completeConsultationSchema,
  type CompleteConsultationInput,
} from "@/schemas/clinical";
import type { MutationResult } from "@/features/patient/actions";
import type { Json, TablesUpdate } from "@/types/database";
import { getMyDoctor } from "@/features/doctor/data";
import { runClinicalBrief } from "@/lib/ai/groq-client";
import { parseScreeningIntake } from "@/features/patient/intake-parser";
import { toAiPrediction } from "@/features/patient/prediction-mapper";
import type { Prediction } from "@/types";

/** Doctor reviews an AI screening, recording an outcome and optional notes. */
export async function reviewPrediction(
  input: PredictionReviewInput,
): Promise<MutationResult> {
  const user = await requireRole(["doctor", "hospital_admin", "super_admin"]);
  const parsed = predictionReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid review" };
  }
  const v = parsed.data;
  const supabase = await createClient();

  // Explicit accessibility check (defense-in-depth): the select is RLS-scoped,
  // so a returned row confirms the reviewer is permitted to see this screening.
  const { data: existing, error: fetchErr } = await supabase
    .from("predictions")
    .select("id")
    .eq("id", v.predictionId)
    .is("deleted_at", null)
    .maybeSingle();
  if (fetchErr) return { ok: false, error: fetchErr.message };
  if (!existing) return { ok: false, error: "Screening not found or not accessible." };

  const { data: updated, error } = await supabase
    .from("predictions")
    .update({
      status: v.status,
      review_notes: v.reviewNotes || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", v.predictionId)
    .select("id, created_by")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!updated) return { ok: false, error: "Screening not found or not accessible." };

  if (updated.created_by) {
    await notify({
      recipientId: updated.created_by,
      type: "prediction_reviewed",
      title: "Your screening was reviewed",
      body: "A clinician has reviewed your recent AI symptom screening.",
      data: { predictionId: updated.id },
    });
  }

  await logAudit({
    action: "prediction.reviewed",
    entityType: "prediction",
    entityId: updated.id,
    metadata: { status: v.status },
  });

  revalidatePath("/doctor/reviews");
  revalidatePath("/doctor");
  revalidatePath("/patient/screenings");
  return { ok: true };
}

function parseStoredBrief(raw: string | null): ClinicalBrief | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = clinicalBriefSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Returns a cached clinical brief, or generates and stores one on first open.
 * Does not run on the patient screening path.
 */
export async function ensureClinicalSummary(
  predictionId: string,
): Promise<MutationResult<{ brief: ClinicalBrief; cached: boolean }>> {
  await requireRole(["doctor", "hospital_admin", "super_admin"]);
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("predictions")
    .select("*")
    .eq("id", predictionId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!row) return { ok: false, error: "Screening not found or not accessible." };

  const cached = parseStoredBrief(row.clinical_summary);
  if (cached) {
    return { ok: true, data: { brief: cached, cached: true } };
  }

  const intake = parseScreeningIntake(row.input_symptoms, row.input_text);
  const prediction = toAiPrediction(row as Prediction);
  const generated = await runClinicalBrief({ intake, prediction });
  if (!generated.ok) {
    return { ok: false, error: generated.error };
  }

  const serialized = JSON.stringify(generated.brief);
  const { error: saveErr } = await supabase
    .from("predictions")
    .update({ clinical_summary: serialized })
    .eq("id", predictionId);

  if (saveErr) return { ok: false, error: saveErr.message };

  await logAudit({
    action: "prediction.clinical_summary",
    entityType: "prediction",
    entityId: predictionId,
    metadata: { model: generated.model },
  });

  return { ok: true, data: { brief: generated.brief, cached: false } };
}

/**
 * Staff updates appointment status (confirm / start / cancel / no-show).
 * Completed requires the consult wizard; check-in with fee uses reception action.
 */
export async function updateAppointmentStatus(
  input: UpdateAppointmentStatusInput,
): Promise<MutationResult> {
  const user = await requireRole(["doctor", "receptionist", "hospital_admin", "super_admin"]);
  const parsed = updateAppointmentStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid status" };
  }
  const v = parsed.data;

  if (v.status === "completed") {
    return {
      ok: false,
      error: "Complete the consultation form to mark this visit completed.",
    };
  }

  if (v.status === "checked_in") {
    return {
      ok: false,
      error: "Use check-in with fee collection from reception.",
    };
  }

  if (v.status === "in_progress" && user.profile.role !== "doctor") {
    return { ok: false, error: "Only the attending doctor can start a consultation." };
  }

  const supabase = await createClient();

  // Fetch first (RLS-scoped) so we can enforce object-level authz in code rather
  // than trusting RLS alone: a doctor may only act on their own appointments.
  const { data: appt, error: apptErr } = await supabase
    .from("appointments")
    .select("id, patient_id, doctor_id")
    .eq("id", v.appointmentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (apptErr) return { ok: false, error: apptErr.message };
  if (!appt) return { ok: false, error: "Appointment not found or not accessible." };

  if (user.profile.role === "doctor") {
    const doctor = await getMyDoctor();
    if (!doctor || appt.doctor_id !== doctor.id) {
      return { ok: false, error: "You can only change appointments assigned to you." };
    }
  }

  const patch: TablesUpdate<"appointments"> = { status: v.status };

  const { data: updated, error } = await supabase
    .from("appointments")
    .update(patch)
    .eq("id", v.appointmentId)
    .select("id, patient_id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!updated) return { ok: false, error: "Appointment not found or not accessible." };

  if (v.status === "confirmed") {
    const { data: patient } = await supabase
      .from("patients")
      .select("profile_id")
      .eq("id", updated.patient_id)
      .maybeSingle();
    if (patient?.profile_id) {
      await notify({
        recipientId: patient.profile_id,
        type: "appointment_confirmed",
        title: "Appointment confirmed",
        body: "Your appointment request has been confirmed.",
        data: { appointmentId: updated.id },
      });
    }
  }

  await logAudit({
    action: "appointment.status_changed",
    entityType: "appointment",
    entityId: updated.id,
    metadata: { status: v.status },
  });

  revalidatePath("/doctor/schedule");
  revalidatePath("/doctor");
  revalidatePath("/reception/queue");
  revalidatePath("/reception/appointments");
  revalidatePath("/reception");
  revalidatePath("/admin");
  revalidatePath("/admin/appointments");
  revalidatePath("/patient/appointments");
  revalidatePath("/patient");
  return { ok: true };
}

/** Doctor saves SOAP + Rx and marks the appointment completed. */
export async function completeConsultation(
  input: CompleteConsultationInput,
): Promise<MutationResult<{ noteId: string }>> {
  await requireRole(["doctor"]);
  const parsed = completeConsultationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid consultation" };
  }
  const v = parsed.data;
  const doctor = await getMyDoctor();
  if (!doctor) return { ok: false, error: "Doctor profile not found." };

  const supabase = await createClient();
  const { data: appt, error: apptErr } = await supabase
    .from("appointments")
    .select("id, patient_id, doctor_id, status, hospital_id")
    .eq("id", v.appointmentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (apptErr) return { ok: false, error: apptErr.message };
  if (!appt) return { ok: false, error: "Appointment not found or not accessible." };
  if (appt.doctor_id !== doctor.id) {
    return { ok: false, error: "You can only complete consultations assigned to you." };
  }
  if (appt.status !== "in_progress") {
    return { ok: false, error: "Start the consultation before completing it." };
  }

  const medsJson = (v.medications ?? []) as unknown as Json;
  const notePayload = {
    appointment_id: appt.id,
    doctor_id: doctor.id,
    patient_id: appt.patient_id,
    subjective: v.subjective,
    objective: v.objective,
    assessment: v.assessment,
    diagnosis: v.diagnosis,
    plan: v.plan,
    prescription: v.prescription,
    medications: medsJson,
  };

  const { data: existing } = await supabase
    .from("consultation_notes")
    .select("id")
    .eq("appointment_id", appt.id)
    .is("deleted_at", null)
    .maybeSingle();

  const noteRes = existing
    ? await supabase
        .from("consultation_notes")
        .update(notePayload)
        .eq("id", existing.id)
        .select("id")
        .single()
    : await supabase.from("consultation_notes").insert(notePayload).select("id").single();

  const note = noteRes.data;
  if (noteRes.error || !note) {
    return { ok: false, error: noteRes.error?.message ?? "Could not save consultation notes." };
  }

  const { error: statusErr } = await supabase
    .from("appointments")
    .update({
      status: "completed",
      checked_out_at: new Date().toISOString(),
    })
    .eq("id", appt.id);

  if (statusErr) return { ok: false, error: statusErr.message };

  await logAudit({
    action: "appointment.consultation_completed",
    entityType: "appointment",
    entityId: appt.id,
    metadata: { noteId: note.id },
  });

  revalidatePath("/doctor/schedule");
  revalidatePath("/doctor");
  revalidatePath(`/doctor/patients/${appt.patient_id}`);
  revalidatePath("/reception/queue");
  revalidatePath("/patient");
  return { ok: true, data: { noteId: note.id } };
}
