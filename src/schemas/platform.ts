import { z } from "zod";

const slug = z
  .string()
  .trim()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only");

export const hospitalSchema = z.object({
  name: z.string().trim().min(2, "Enter a hospital name").max(160),
  slug,
  city: z.string().trim().max(120).optional().or(z.literal("")),
  timezone: z.string().trim().max(60).optional().or(z.literal("")),
});
export type HospitalInput = z.infer<typeof hospitalSchema>;

export const updateHospitalSchema = z.object({
  name: z.string().trim().min(2, "Enter a hospital name").max(160),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  timezone: z.string().trim().max(60).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
});
export type UpdateHospitalInput = z.infer<typeof updateHospitalSchema>;

export const specialtySchema = z.object({
  name: z.string().trim().min(2, "Enter a specialty name").max(120),
  slug,
  description: z.string().trim().max(500).optional().or(z.literal("")),
});
export type SpecialtyInput = z.infer<typeof specialtySchema>;

export const updateSpecialtySchema = specialtySchema.extend({
  id: z.string().uuid(),
});
export type UpdateSpecialtyInput = z.infer<typeof updateSpecialtySchema>;

export const assignHospitalAdminSchema = z.object({
  profileId: z.string().uuid(),
  hospitalId: z.string().uuid(),
});
export type AssignHospitalAdminInput = z.infer<typeof assignHospitalAdminSchema>;

export const transferDoctorSchema = z.object({
  doctorId: z.string().uuid(),
  toHospitalId: z.string().uuid(),
});
export type TransferDoctorInput = z.infer<typeof transferDoctorSchema>;
