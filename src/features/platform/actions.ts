"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import {
  hospitalSchema,
  specialtySchema,
  assignHospitalAdminSchema,
  type HospitalInput,
  type SpecialtyInput,
  type AssignHospitalAdminInput,
} from "@/schemas/platform";
import type { MutationResult } from "@/features/patient/actions";

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
  if (error) return { ok: false, error: error.message };
  await logAudit({ action: "specialty.created", entityType: "specialty", entityId: data.id });
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
