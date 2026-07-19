"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import {
  departmentSchema,
  doctorSchema,
  updateDoctorSchema,
  availabilitySchema,
  roleAssignSchema,
  promoteStaffSchema,
  type DepartmentInput,
  type DoctorInput,
  type UpdateDoctorInput,
  type AvailabilityInput,
  type RoleAssignInput,
  type PromoteStaffInput,
} from "@/schemas/admin";
import {
  updateHospitalSchema,
  type UpdateHospitalInput,
} from "@/schemas/platform";
import type { MutationResult } from "@/features/patient/actions";

async function hospitalId(): Promise<string | null> {
  const user = await requireRole(["hospital_admin", "super_admin"]);
  return user.profile.hospital_id;
}

/** Hospital admin updates their own hospital details. */
export async function updateMyHospital(input: UpdateHospitalInput): Promise<MutationResult> {
  const user = await requireRole(["hospital_admin"]);
  const hid = user.profile.hospital_id;
  if (!hid) return { ok: false, error: "Your account is not linked to a hospital." };
  const parsed = updateHospitalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  const v = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("hospitals")
    .update({
      name: v.name,
      city: v.city || null,
      timezone: v.timezone || "Asia/Karachi",
      phone: v.phone || null,
      address: v.address || null,
      email: v.email || null,
    })
    .eq("id", hid);

  if (error) return { ok: false, error: error.message };

  await logAudit({
    action: "hospital.updated",
    entityType: "hospital",
    entityId: hid,
  });
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return { ok: true };
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

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, role, hospital_id")
    .eq("id", parsed.data.profileId)
    .is("deleted_at", null)
    .maybeSingle();

  if (profileErr) return { ok: false, error: profileErr.message };
  if (!profile || profile.hospital_id !== hid) {
    return { ok: false, error: "Staff member not found in your hospital." };
  }
  if (profile.role !== "doctor" && profile.role !== "receptionist") {
    return {
      ok: false,
      error: "Only Doctor or Receptionist roles can be changed here. Use Promote to staff for patients.",
    };
  }

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

/** Promote a patient (or unassigned hospital user) to doctor/receptionist. */
export async function promoteToStaff(input: PromoteStaffInput): Promise<MutationResult> {
  const hid = await hospitalId();
  if (!hid) return { ok: false, error: "Your account is not linked to a hospital." };
  const parsed = promoteStaffSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  const supabase = await createClient();

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, role, hospital_id")
    .eq("id", parsed.data.profileId)
    .is("deleted_at", null)
    .maybeSingle();

  if (profileErr) return { ok: false, error: profileErr.message };
  if (!profile) return { ok: false, error: "User not found." };
  if (profile.role === "super_admin" || profile.role === "hospital_admin") {
    return { ok: false, error: "Cannot change this account from Staff." };
  }
  if (profile.hospital_id && profile.hospital_id !== hid) {
    return { ok: false, error: "User belongs to another hospital." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role, hospital_id: hid })
    .eq("id", parsed.data.profileId);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    action: "staff.promoted",
    entityType: "profile",
    entityId: parsed.data.profileId,
    metadata: { role: parsed.data.role, from: profile.role },
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

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, role, hospital_id")
    .eq("id", v.profileId)
    .is("deleted_at", null)
    .maybeSingle();

  if (profileErr) return { ok: false, error: profileErr.message };
  if (!profile || profile.hospital_id !== hid) {
    return { ok: false, error: "Staff member not found in your hospital." };
  }
  if (profile.role !== "doctor") {
    return {
      ok: false,
      error: "Only staff with the Doctor role can be added. Assign Doctor on Staff first.",
    };
  }

  const { data: existingDoctor } = await supabase
    .from("doctors")
    .select("id")
    .eq("profile_id", v.profileId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingDoctor) {
    return { ok: false, error: "This staff member already has a doctor profile." };
  }

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

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "This staff member already has a doctor profile." };
    }
    return { ok: false, error: error.message };
  }

  await logAudit({ action: "doctor.created", entityType: "doctor", entityId: data.id });
  revalidatePath("/admin/doctors");
  revalidatePath("/admin/staff");
  return { ok: true };
}

export async function updateDoctor(input: UpdateDoctorInput): Promise<MutationResult> {
  const hid = await hospitalId();
  if (!hid) return { ok: false, error: "Your account is not linked to a hospital." };
  const parsed = updateDoctorSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  const v = parsed.data;
  const supabase = await createClient();

  const { data: doctor, error: doctorErr } = await supabase
    .from("doctors")
    .select("id, profile_id, hospital_id")
    .eq("id", v.doctorId)
    .is("deleted_at", null)
    .maybeSingle();

  if (doctorErr) return { ok: false, error: doctorErr.message };
  if (!doctor || doctor.hospital_id !== hid) {
    return { ok: false, error: "Doctor not found in your hospital." };
  }

  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ full_name: v.fullName })
    .eq("id", doctor.profile_id);

  if (profileErr) return { ok: false, error: profileErr.message };

  const { error } = await supabase
    .from("doctors")
    .update({
      specialty_id: v.specialtyId || null,
      department_id: v.departmentId || null,
      license_number: v.licenseNumber || null,
      years_experience: v.yearsExperience ?? null,
      consultation_fee: v.consultationFee ?? null,
    })
    .eq("id", doctor.id);

  if (error) return { ok: false, error: error.message };

  await logAudit({
    action: "doctor.updated",
    entityType: "doctor",
    entityId: doctor.id,
    metadata: { fullName: v.fullName },
  });
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
