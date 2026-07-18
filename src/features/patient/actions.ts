"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { patientOnboardingSchema, type PatientOnboardingInput } from "@/schemas/patient";
import { logAudit } from "@/lib/audit";

export type MutationResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

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
