"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, requireRole } from "@/lib/auth/session";
import { patientOnboardingSchema, type PatientOnboardingInput } from "@/schemas/patient";
import { symptomIntakeSchema, type SymptomIntakeInput } from "@/schemas/prediction";
import { runSymptomPrediction } from "@/lib/ai/groq-client";
import type { AiPrediction } from "@/schemas/prediction";
import { logAudit } from "@/lib/audit";
import type { Json } from "@/types/database";

export type MutationResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export type ScreeningResult = {
  predictionId: string;
  prediction: AiPrediction;
  degraded: boolean;
  recommendedSpecialtyId: string | null;
};

/**
 * Runs an AI symptom screening for the signed-in patient, then persists it to
 * `predictions` for clinician review. The AI output is always validated and a
 * safe fallback is stored if the model is unavailable.
 */
export async function runScreening(
  input: SymptomIntakeInput,
): Promise<MutationResult<ScreeningResult>> {
  const user = await requireRole(["patient"]);
  const parsed = symptomIntakeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please review your symptoms" };
  }
  const supabase = await createClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("id, hospital_id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!patient) return { ok: false, error: "Complete your patient profile first." };

  const { prediction, model, degraded } = await runSymptomPrediction(parsed.data);

  // Best-effort mapping of the model's free-text specialty to a known specialty.
  const { data: specialty } = await supabase
    .from("specialties")
    .select("id")
    .ilike("name", prediction.recommended_specialty)
    .maybeSingle();

  const { data: row, error } = await supabase
    .from("predictions")
    .insert({
      patient_id: patient.id,
      hospital_id: patient.hospital_id,
      created_by: user.id,
      model,
      risk_level: prediction.risk_level,
      confidence: prediction.confidence,
      explanation: prediction.explanation,
      predicted_conditions: prediction.predicted_conditions as unknown as Json,
      input_symptoms: parsed.data.symptoms as unknown as Json,
      input_text: parsed.data.notes || null,
      recommended_specialty_id: specialty?.id ?? null,
      recommended_specialty_label: prediction.recommended_specialty,
      raw_output: prediction as unknown as Json,
      status: "pending_review",
    })
    .select("id")
    .single();

  if (error || !row) {
    return { ok: false, error: error?.message ?? "Could not save your screening." };
  }

  await logAudit({
    action: "prediction.created",
    entityType: "prediction",
    entityId: row.id,
    metadata: { risk_level: prediction.risk_level, degraded },
  });

  revalidatePath("/patient/screenings");
  revalidatePath("/patient");
  return {
    ok: true,
    data: {
      predictionId: row.id,
      prediction,
      degraded,
      recommendedSpecialtyId: specialty?.id ?? null,
    },
  };
}

/** Completes patient onboarding: creates the patient record and lifts the gate. */
export async function completeOnboarding(
  input: PatientOnboardingInput,
): Promise<MutationResult<{ patientId: string }>> {
  const user = await requireUser();
  const parsed = patientOnboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }
  const v = parsed.data;
  const supabase = await createClient();

  // Upsert the patient record owned by this profile.
  const { data: existing } = await supabase
    .from("patients")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  let patientId = existing?.id ?? null;

  if (patientId) {
    const { error } = await supabase
      .from("patients")
      .update({
        full_name: v.fullName,
        dob: v.dob,
        gender: v.gender,
        phone: v.phone,
        blood_group: v.bloodGroup === "unknown" ? null : v.bloodGroup ?? null,
        address: v.address || null,
        emergency_contact_name: v.emergencyContactName || null,
        emergency_contact_phone: v.emergencyContactPhone || null,
      })
      .eq("id", patientId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data, error } = await supabase
      .from("patients")
      .insert({
        profile_id: user.id,
        full_name: v.fullName,
        dob: v.dob,
        gender: v.gender,
        phone: v.phone,
        blood_group: v.bloodGroup === "unknown" ? null : v.bloodGroup ?? null,
        address: v.address || null,
        emergency_contact_name: v.emergencyContactName || null,
        emergency_contact_phone: v.emergencyContactPhone || null,
        email: user.email,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    patientId = data.id;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: v.fullName, phone: v.phone, onboarding_completed: true })
    .eq("id", user.id);
  if (profileError) return { ok: false, error: profileError.message };

  await logAudit({ action: "patient.onboarding_completed", entityType: "patient", entityId: patientId });

  revalidatePath("/patient");
  return { ok: true, data: { patientId } };
}
