"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import {
  departmentSchema,
  doctorSchema,
  availabilitySchema,
  roleAssignSchema,
  type DepartmentInput,
  type DoctorInput,
  type AvailabilityInput,
  type RoleAssignInput,
} from "@/schemas/admin";
import type { MutationResult } from "@/features/patient/actions";

async function hospitalId(): Promise<string | null> {
  const user = await requireRole(["hospital_admin", "super_admin"]);
  return user.profile.hospital_id;
}

export async function createDepartment(input: DepartmentInput): Promise<MutationResult> {
  const hid = await hospitalId();
  if (!hid) return { ok: false, error: "Your account is not linked to a hospital." };
  const parsed = departmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .insert({ hospital_id: hid, name: parsed.data.name, description: parsed.data.description || null })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  await logAudit({ action: "department.created", entityType: "department", entityId: data.id });
  revalidatePath("/admin/departments");
  return { ok: true };
}

export async function setDepartmentActive(id: string, isActive: boolean): Promise<MutationResult> {
  await requireRole(["hospital_admin", "super_admin"]);
  const supabase = await createClient();
  const { error } = await supabase.from("departments").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/departments");
  return { ok: true };
}

export async function assignRole(input: RoleAssignInput): Promise<MutationResult> {
  const hid = await hospitalId();
  if (!hid) return { ok: false, error: "Your account is not linked to a hospital." };
  const parsed = roleAssignSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role, hospital_id: hid })
    .eq("id", parsed.data.profileId);
  if (error) return { ok: false, error: error.message };
  await logAudit({
    action: "staff.role_assigned",
    entityType: "profile",
    entityId: parsed.data.profileId,
    metadata: { role: parsed.data.role },
  });
  revalidatePath("/admin/staff");
  revalidatePath("/admin/doctors");
  return { ok: true };
}

export async function addDoctor(input: DoctorInput): Promise<MutationResult> {
  const hid = await hospitalId();
  if (!hid) return { ok: false, error: "Your account is not linked to a hospital." };
  const parsed = doctorSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  const v = parsed.data;
  const supabase = await createClient();

  // Ensure the staff member is a doctor within this hospital.
  const roleRes = await assignRole({ profileId: v.profileId, role: "doctor" });
  if (!roleRes.ok) return roleRes;

  const { data, error } = await supabase
    .from("doctors")
    .insert({
      hospital_id: hid,
      profile_id: v.profileId,
      specialty_id: v.specialtyId || null,
      department_id: v.departmentId || null,
      license_number: v.licenseNumber || null,
      years_experience: v.yearsExperience ?? null,
      consultation_fee: v.consultationFee ?? null,
      bio: v.bio || null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  await logAudit({ action: "doctor.created", entityType: "doctor", entityId: data.id });
  revalidatePath("/admin/doctors");
  return { ok: true };
}

export async function setDoctorActive(id: string, isActive: boolean): Promise<MutationResult> {
  await requireRole(["hospital_admin", "super_admin"]);
  const supabase = await createClient();
  const { error } = await supabase.from("doctors").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/doctors");
  return { ok: true };
}

export async function addAvailability(input: AvailabilityInput): Promise<MutationResult> {
  await requireRole(["hospital_admin", "super_admin"]);
  const parsed = availabilitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("doctor_availability").insert({
    doctor_id: v.doctorId,
    weekday: v.weekday,
    start_time: `${v.startTime}:00`,
    end_time: `${v.endTime}:00`,
    slot_minutes: v.slotMinutes,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/doctors");
  return { ok: true };
}

export async function removeAvailability(id: string): Promise<MutationResult> {
  await requireRole(["hospital_admin", "super_admin"]);
  const supabase = await createClient();
  const { error } = await supabase.from("doctor_availability").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/doctors");
  return { ok: true };
}
