"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import {
  hospitalSchema,
  specialtySchema,
  updateSpecialtySchema,
  assignHospitalAdminSchema,
  transferDoctorSchema,
  type HospitalInput,
  type SpecialtyInput,
  type UpdateSpecialtyInput,
  type AssignHospitalAdminInput,
  type TransferDoctorInput,
} from "@/schemas/platform";
import type { MutationResult } from "@/features/patient/actions";
import { createAdminClient } from "@/lib/supabase/admin";

const OPEN_APPOINTMENT_STATUSES = ["pending", "confirmed", "checked_in", "in_progress"] as const;
function specialtyUniqueError(message: string): string {
  if (/duplicate|unique|23505/i.test(message)) {
    return "A specialty with this name or slug already exists.";
  }
  return message;
}

export async function createHospital(input: HospitalInput): Promise<MutationResult> {
  await requireRole(["super_admin"]);
  const parsed = hospitalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  const v = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hospitals")
    .insert({
      name: v.name,
      slug: v.slug,
      city: v.city || null,
      timezone: v.timezone || "UTC",
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  await logAudit({ action: "hospital.created", entityType: "hospital", entityId: data.id });
  revalidatePath("/platform/hospitals");
  return { ok: true };
}

export async function setHospitalActive(id: string, isActive: boolean): Promise<MutationResult> {
  await requireRole(["super_admin"]);
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid hospital reference." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("hospitals")
    .update({ is_active: Boolean(isActive) })
    .eq("id", parsed.data);
  if (error) return { ok: false, error: error.message };
  await logAudit({
    action: "hospital.active_changed",
    entityType: "hospital",
    entityId: parsed.data,
    metadata: { isActive: Boolean(isActive) },
  });
  revalidatePath("/platform/hospitals");
  return { ok: true };
}

export async function createSpecialty(input: SpecialtyInput): Promise<MutationResult> {
  await requireRole(["super_admin"]);
  const parsed = specialtySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  const v = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("specialties")
    .insert({ name: v.name, slug: v.slug, description: v.description || null })
    .select("id")
    .single();
  if (error) return { ok: false, error: specialtyUniqueError(error.message) };
  await logAudit({ action: "specialty.created", entityType: "specialty", entityId: data.id });
  revalidatePath("/platform/specialties");
  return { ok: true };
}

export async function updateSpecialty(input: UpdateSpecialtyInput): Promise<MutationResult> {
  await requireRole(["super_admin"]);
  const parsed = updateSpecialtySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("specialties")
    .update({
      name: v.name,
      slug: v.slug,
      description: v.description || null,
    })
    .eq("id", v.id);
  if (error) return { ok: false, error: specialtyUniqueError(error.message) };
  await logAudit({ action: "specialty.updated", entityType: "specialty", entityId: v.id });
  revalidatePath("/platform/specialties");
  return { ok: true };
}

export async function deleteSpecialty(id: string): Promise<MutationResult> {
  await requireRole(["super_admin"]);
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid specialty reference." };
  const supabase = await createClient();
  const { error } = await supabase.from("specialties").delete().eq("id", parsed.data);
  if (error) return { ok: false, error: error.message };
  await logAudit({ action: "specialty.deleted", entityType: "specialty", entityId: parsed.data });
  revalidatePath("/platform/specialties");
  return { ok: true };
}

export async function assignHospitalAdmin(
  input: AssignHospitalAdminInput,
): Promise<MutationResult> {
  await requireRole(["super_admin"]);
  const parsed = assignHospitalAdminSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: "hospital_admin", hospital_id: parsed.data.hospitalId })
    .eq("id", parsed.data.profileId);
  if (error) return { ok: false, error: error.message };
  await logAudit({
    action: "platform.hospital_admin_assigned",
    entityType: "profile",
    entityId: parsed.data.profileId,
    metadata: { hospitalId: parsed.data.hospitalId },
  });
  revalidatePath("/platform/hospitals");
  return { ok: true };
}

/**
 * Move a doctor (and their profile hospital link) to another hospital.
 * Blocked while they have open future appointments.
 */
export async function transferDoctor(input: TransferDoctorInput): Promise<MutationResult> {
  await requireRole(["super_admin"]);
  const parsed = transferDoctorSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  const { doctorId, toHospitalId } = parsed.data;

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Admin client is not configured.",
    };
  }

  const { data: doctor, error: doctorErr } = await admin
    .from("doctors")
    .select("id, profile_id, hospital_id")
    .eq("id", doctorId)
    .is("deleted_at", null)
    .maybeSingle();

  if (doctorErr) return { ok: false, error: doctorErr.message };
  if (!doctor) return { ok: false, error: "Doctor not found." };
  if (doctor.hospital_id === toHospitalId) {
    return { ok: false, error: "Doctor is already at that hospital." };
  }

  const { data: profile, error: profileReadErr } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", doctor.profile_id)
    .maybeSingle();

  if (profileReadErr) return { ok: false, error: profileReadErr.message };
  if (!profile) return { ok: false, error: "Doctor profile not found." };
  if (profile.role !== "doctor") {
    return { ok: false, error: "Linked profile is not a doctor account." };
  }

  const { data: targetHospital, error: hospitalErr } = await admin
    .from("hospitals")
    .select("id, is_active")
    .eq("id", toHospitalId)
    .is("deleted_at", null)
    .maybeSingle();

  if (hospitalErr) return { ok: false, error: hospitalErr.message };
  if (!targetHospital) return { ok: false, error: "Destination hospital not found." };
  if (!targetHospital.is_active) {
    return { ok: false, error: "Destination hospital is inactive." };
  }

  const nowIso = new Date().toISOString();
  const { count, error: apptErr } = await admin
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("doctor_id", doctorId)
    .is("deleted_at", null)
    .in("status", [...OPEN_APPOINTMENT_STATUSES])
    .gte("scheduled_start", nowIso);

  if (apptErr) return { ok: false, error: apptErr.message };
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: `Cannot transfer: this doctor has ${count} open upcoming appointment${count === 1 ? "" : "s"}. Resolve or cancel them first.`,
    };
  }

  const { data: updatedDoctor, error: updateDoctorErr } = await admin
    .from("doctors")
    .update({
      hospital_id: toHospitalId,
      department_id: null,
    })
    .eq("id", doctorId)
    .select("id")
    .maybeSingle();

  if (updateDoctorErr) return { ok: false, error: updateDoctorErr.message };
  if (!updatedDoctor) return { ok: false, error: "Could not update the doctor record." };

  const { data: updatedProfile, error: profileErr } = await admin
    .from("profiles")
    .update({ hospital_id: toHospitalId })
    .eq("id", doctor.profile_id)
    .select("id")
    .maybeSingle();

  if (profileErr) return { ok: false, error: profileErr.message };
  if (!updatedProfile) return { ok: false, error: "Could not update the doctor's profile hospital." };

  await logAudit({
    action: "doctor.transferred",
    entityType: "doctor",
    entityId: doctorId,
    metadata: { fromHospitalId: doctor.hospital_id, toHospitalId },
  });
  revalidatePath("/platform/doctors");
  revalidatePath("/admin/doctors");
  return { ok: true };
}
