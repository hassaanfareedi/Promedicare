"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

const uuidSchema = z.string().uuid();
import {
  departmentSchema,
  doctorSchema,
  createDoctorAccountSchema,
  updateDoctorSchema,
  availabilitySchema,
  availabilityBatchSchema,
  roleAssignSchema,
  promoteStaffSchema,
  type DepartmentInput,
  type DoctorInput,
  type CreateDoctorAccountInput,
  type UpdateDoctorInput,
  type AvailabilityInput,
  type AvailabilityBatchInput,
  type RoleAssignInput,
  type PromoteStaffInput,
} from "@/schemas/admin";
import {
  updateHospitalSchema,
  type UpdateHospitalInput,
} from "@/schemas/platform";
import type { MutationResult } from "@/features/patient/actions";
import { createAdminClient } from "@/lib/supabase/admin";

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
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "A department with this name already exists." };
    }
    return { ok: false, error: error.message };
  }
  await logAudit({ action: "department.created", entityType: "department", entityId: data.id });
  revalidatePath("/admin/departments");
  return { ok: true };
}

export async function setDepartmentActive(id: string, isActive: boolean): Promise<MutationResult> {
  await requireRole(["hospital_admin", "super_admin"]);
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid department reference." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("departments")
    .update({ is_active: Boolean(isActive) })
    .eq("id", parsed.data);
  if (error) return { ok: false, error: error.message };
  await logAudit({
    action: "department.active_changed",
    entityType: "department",
    entityId: parsed.data,
    metadata: { isActive: Boolean(isActive) },
  });
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
  if (!profile) return { ok: false, error: "User not found." };
  if (profile.role === "super_admin" || profile.role === "hospital_admin") {
    return { ok: false, error: "Admin accounts cannot be linked as doctors." };
  }
  if (profile.hospital_id && profile.hospital_id !== hid) {
    return { ok: false, error: "User belongs to another hospital." };
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

  // One-step: assign Doctor role (and hospital) when promoting receptionist/patient.
  if (profile.role !== "doctor" || profile.hospital_id !== hid) {
    const { error: roleErr } = await supabase
      .from("profiles")
      .update({ role: "doctor", hospital_id: hid })
      .eq("id", profile.id);
    if (roleErr) return { ok: false, error: roleErr.message };
    await logAudit({
      action: "staff.promoted",
      entityType: "profile",
      entityId: profile.id,
      metadata: { role: "doctor", from: profile.role, via: "add_doctor" },
    });
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

/**
 * Create a brand-new doctor account for this hospital: Auth user + profile +
 * clinical doctor row. Uses the service-role client for Auth Admin APIs.
 */
export async function createDoctorAccount(
  input: CreateDoctorAccountInput,
): Promise<MutationResult<{ doctorId: string }>> {
  const hid = await hospitalId();
  if (!hid) return { ok: false, error: "Your account is not linked to a hospital." };
  const parsed = createDoctorAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }
  const v = parsed.data;

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Admin client is not configured.",
    };
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: v.email,
    password: v.password,
    email_confirm: true,
    user_metadata: { full_name: v.fullName },
  });

  if (createErr || !created.user) {
    const msg = createErr?.message ?? "Could not create the account.";
    if (/already|registered|exists/i.test(msg)) {
      return { ok: false, error: "An account with this email already exists." };
    }
    return { ok: false, error: msg };
  }

  const userId = created.user.id;

  const { error: profileErr } = await admin.from("profiles").upsert(
    {
      id: userId,
      role: "doctor",
      hospital_id: hid,
      full_name: v.fullName,
      email: v.email,
      onboarding_completed: true,
    },
    { onConflict: "id" },
  );

  if (profileErr) {
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: profileErr.message };
  }

  const { data: doctor, error: doctorErr } = await admin
    .from("doctors")
    .insert({
      hospital_id: hid,
      profile_id: userId,
      specialty_id: v.specialtyId || null,
      department_id: v.departmentId || null,
      license_number: v.licenseNumber || null,
      years_experience: v.yearsExperience ?? null,
      consultation_fee: v.consultationFee ?? null,
    })
    .select("id")
    .single();

  if (doctorErr || !doctor) {
    await admin.auth.admin.deleteUser(userId);
    if (doctorErr?.code === "23505") {
      return { ok: false, error: "This account already has a doctor profile." };
    }
    return { ok: false, error: doctorErr?.message ?? "Could not create doctor profile." };
  }

  await logAudit({
    action: "doctor.created",
    entityType: "doctor",
    entityId: doctor.id,
    metadata: { profileId: userId, email: v.email, via: "create_account" },
  });
  revalidatePath("/admin/doctors");
  revalidatePath("/admin/staff");
  return { ok: true, data: { doctorId: doctor.id } };
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

  // Service role: repair orphan profiles (null hospital_id) that user RLS cannot update.
  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Admin client is not configured.",
    };
  }

  const { data: existingProfile, error: profileReadErr } = await admin
    .from("profiles")
    .select("id, role, email, hospital_id")
    .eq("id", doctor.profile_id)
    .maybeSingle();

  if (profileReadErr) return { ok: false, error: profileReadErr.message };
  if (!existingProfile) return { ok: false, error: "Doctor profile not found." };
  if (existingProfile.role === "super_admin" || existingProfile.role === "hospital_admin") {
    return { ok: false, error: "Admin accounts cannot be edited as doctors." };
  }

  const { data: profileRow, error: profileErr } = await admin
    .from("profiles")
    .update({
      full_name: v.fullName,
      hospital_id: hid,
      role: "doctor",
    })
    .eq("id", doctor.profile_id)
    .select("id")
    .maybeSingle();

  if (profileErr) return { ok: false, error: profileErr.message };
  if (!profileRow) return { ok: false, error: "Could not update the doctor's profile." };

  const { data: updated, error } = await supabase
    .from("doctors")
    .update({
      specialty_id: v.specialtyId || null,
      department_id: v.departmentId || null,
      license_number: v.licenseNumber || null,
      years_experience: v.yearsExperience ?? null,
      consultation_fee: v.consultationFee ?? null,
    })
    .eq("id", doctor.id)
    .eq("hospital_id", hid)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!updated) return { ok: false, error: "Could not update the doctor record." };

  await logAudit({
    action: "doctor.updated",
    entityType: "doctor",
    entityId: doctor.id,
    metadata: { fullName: v.fullName },
  });
  revalidatePath("/admin/doctors");
  revalidatePath("/admin/staff");
  return { ok: true };
}

export async function setDoctorActive(id: string, isActive: boolean): Promise<MutationResult> {
  const hid = await hospitalId();
  if (!hid) return { ok: false, error: "Your account is not linked to a hospital." };
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid doctor reference." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("doctors")
    .update({ is_active: Boolean(isActive) })
    .eq("id", parsed.data)
    .eq("hospital_id", hid)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Doctor not found in your hospital." };
  await logAudit({
    action: "doctor.active_changed",
    entityType: "doctor",
    entityId: parsed.data,
    metadata: { isActive: Boolean(isActive) },
  });
  revalidatePath("/admin/doctors");
  return { ok: true };
}

export async function addAvailability(input: AvailabilityInput): Promise<MutationResult> {
  await requireRole(["hospital_admin", "super_admin"]);
  const parsed = availabilitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  const v = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("doctor_availability")
    .insert({
      doctor_id: v.doctorId,
      weekday: v.weekday,
      start_time: `${v.startTime}:00`,
      end_time: `${v.endTime}:00`,
      slot_minutes: v.slotMinutes,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  await logAudit({
    action: "availability.added",
    entityType: "doctor_availability",
    entityId: data.id,
    metadata: { doctorId: v.doctorId, weekday: v.weekday },
  });
  revalidatePath("/admin/doctors");
  return { ok: true };
}

/** Add the same hours to multiple weekdays; skips days that already have a slot. */
export async function addAvailabilityBatch(
  input: AvailabilityBatchInput,
): Promise<MutationResult<{ added: number; skipped: number }>> {
  const hid = await hospitalId();
  if (!hid) return { ok: false, error: "Your account is not linked to a hospital." };
  const parsed = availabilityBatchSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  const v = parsed.data;
  const supabase = await createClient();

  const { data: doctor, error: doctorErr } = await supabase
    .from("doctors")
    .select("id")
    .eq("id", v.doctorId)
    .eq("hospital_id", hid)
    .is("deleted_at", null)
    .maybeSingle();
  if (doctorErr) return { ok: false, error: doctorErr.message };
  if (!doctor) return { ok: false, error: "Doctor not found in your hospital." };

  const { data: existing, error: existingErr } = await supabase
    .from("doctor_availability")
    .select("weekday")
    .eq("doctor_id", v.doctorId);
  if (existingErr) return { ok: false, error: existingErr.message };

  const taken = new Set((existing ?? []).map((r) => r.weekday));
  const uniqueDays = [...new Set(v.weekdays)];
  const toAdd = uniqueDays.filter((d) => !taken.has(d));
  const skipped = uniqueDays.length - toAdd.length;

  if (toAdd.length === 0) {
    return { ok: true, data: { added: 0, skipped } };
  }

  const rows = toAdd.map((weekday) => ({
    doctor_id: v.doctorId,
    weekday,
    start_time: `${v.startTime}:00`,
    end_time: `${v.endTime}:00`,
    slot_minutes: v.slotMinutes,
  }));

  const { data: inserted, error } = await supabase
    .from("doctor_availability")
    .insert(rows)
    .select("id");
  if (error) return { ok: false, error: error.message };

  await logAudit({
    action: "availability.batch_added",
    entityType: "doctor",
    entityId: v.doctorId,
    metadata: { weekdays: toAdd, added: inserted?.length ?? toAdd.length, skipped },
  });
  revalidatePath("/admin/doctors");
  return { ok: true, data: { added: inserted?.length ?? toAdd.length, skipped } };
}

export async function removeAvailability(id: string): Promise<MutationResult> {
  await requireRole(["hospital_admin", "super_admin"]);
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid availability reference." };
  const supabase = await createClient();
  const { error } = await supabase.from("doctor_availability").delete().eq("id", parsed.data);
  if (error) return { ok: false, error: error.message };
  await logAudit({
    action: "availability.removed",
    entityType: "doctor_availability",
    entityId: parsed.data,
  });
  revalidatePath("/admin/doctors");
  return { ok: true };
}
