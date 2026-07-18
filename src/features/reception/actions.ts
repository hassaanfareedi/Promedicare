"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { walkInPatientSchema, type WalkInPatientInput } from "@/schemas/patient";
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
