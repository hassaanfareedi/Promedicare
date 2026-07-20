import { z } from "zod";
import { emailSchema, passwordSchema } from "@/schemas/auth";

export const departmentSchema = z.object({
  name: z.string().trim().min(2, "Enter a department name").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});
export type DepartmentInput = z.infer<typeof departmentSchema>;

export const doctorSchema = z.object({
  profileId: z.string().uuid("Select a staff member"),
  specialtyId: z.string().uuid().optional().or(z.literal("")),
  departmentId: z.string().uuid().optional().or(z.literal("")),
  licenseNumber: z.string().trim().max(80).optional().or(z.literal("")),
  yearsExperience: z.coerce.number().int().min(0).max(70).optional(),
  consultationFee: z.coerce.number().min(0).max(100000).optional(),
  bio: z.string().trim().max(1000).optional().or(z.literal("")),
});
export type DoctorInput = z.infer<typeof doctorSchema>;

/** Create a brand-new auth user + doctor profile for the hospital. */
export const createDoctorAccountSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter the doctor's full name").max(120),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    specialtyId: z.string().uuid().optional().or(z.literal("")),
    departmentId: z.string().uuid().optional().or(z.literal("")),
    licenseNumber: z.string().trim().max(80).optional().or(z.literal("")),
    yearsExperience: z.coerce.number().int().min(0).max(70).optional(),
    consultationFee: z.coerce.number().min(0).max(100000).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type CreateDoctorAccountInput = z.infer<typeof createDoctorAccountSchema>;

export const updateDoctorSchema = z.object({
  doctorId: z.string().uuid(),
  fullName: z.string().trim().min(2, "Enter a name").max(120),
  specialtyId: z.string().uuid().optional().or(z.literal("")),
  departmentId: z.string().uuid().optional().or(z.literal("")),
  licenseNumber: z.string().trim().max(80).optional().or(z.literal("")),
  yearsExperience: z.coerce.number().int().min(0).max(70).optional(),
  consultationFee: z.coerce.number().min(0).max(100000).optional(),
});
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;

const timeString = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM");

export const availabilitySchema = z
  .object({
    doctorId: z.string().uuid(),
    weekday: z.coerce.number().int().min(0).max(6),
    startTime: timeString,
    endTime: timeString,
    slotMinutes: z.coerce.number().int().min(5).max(240),
  })
  .refine((v) => v.startTime < v.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });
export type AvailabilityInput = z.infer<typeof availabilitySchema>;

/** Apply the same hours to multiple weekdays (e.g. Mon–Fri). */
export const availabilityBatchSchema = z
  .object({
    doctorId: z.string().uuid(),
    weekdays: z.array(z.coerce.number().int().min(0).max(6)).min(1).max(7),
    startTime: timeString,
    endTime: timeString,
    slotMinutes: z.coerce.number().int().min(5).max(240),
  })
  .refine((v) => v.startTime < v.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });
export type AvailabilityBatchInput = z.infer<typeof availabilityBatchSchema>;

export const roleAssignSchema = z.object({
  profileId: z.string().uuid(),
  role: z.enum(["doctor", "receptionist"]),
});
export type RoleAssignInput = z.infer<typeof roleAssignSchema>;

/** Promote a hospital patient account into staff (doctor or receptionist). */
export const promoteStaffSchema = z.object({
  profileId: z.string().uuid(),
  role: z.enum(["doctor", "receptionist"]),
});
export type PromoteStaffInput = z.infer<typeof promoteStaffSchema>;

export const demoteStaffSchema = z.object({
  profileId: z.string().uuid(),
});
export type DemoteStaffInput = z.infer<typeof demoteStaffSchema>;

/** Create a brand-new auth user as receptionist for the hospital. */
export const createReceptionistAccountSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter the receptionist's full name").max(120),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type CreateReceptionistAccountInput = z.infer<typeof createReceptionistAccountSchema>;
