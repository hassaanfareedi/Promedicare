import { z } from "zod";

export const genderEnum = z.enum(["male", "female", "other", "prefer_not_to_say"]);

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(20)
  .regex(/^[+\d][\d\s-]*$/, "Enter a valid phone number");

export const patientOnboardingSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  dob: z
    .string()
    .min(1, "Date of birth is required")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date")
    .refine((v) => new Date(v) < new Date(), "Date of birth must be in the past"),
  gender: genderEnum,
  phone: phoneSchema,
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"]).optional(),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  emergencyContactName: z.string().trim().max(120).optional().or(z.literal("")),
  emergencyContactPhone: phoneSchema.optional().or(z.literal("")),
});

export type PatientOnboardingInput = z.infer<typeof patientOnboardingSchema>;

/** Staff-side walk-in patient registration (receptionist / admin). */
export const walkInPatientSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the patient's full name").max(120),
  dob: z.string().min(1, "Date of birth is required"),
  gender: genderEnum,
  phone: phoneSchema,
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
});

export type WalkInPatientInput = z.infer<typeof walkInPatientSchema>;
