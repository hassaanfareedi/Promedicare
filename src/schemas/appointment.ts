import { z } from "zod";
import { genderEnum } from "@/schemas/patient";

const receptionPhoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(20)
  .regex(/^[+\d][\d\s-]*$/, "Enter a valid phone number");

export const bookAppointmentSchema = z.object({
  hospitalId: z.string().uuid("Select a hospital"),
  doctorId: z.string().uuid("Select a doctor"),
  departmentId: z.string().uuid().optional(),
  scheduledStart: z
    .string()
    .min(1, "Choose a time slot")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid time slot")
    .refine((v) => new Date(v) > new Date(), "Choose a future time slot"),
  reason: z.string().trim().max(500).optional().or(z.literal("")),
  predictionId: z.string().uuid().optional(),
});

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;

export const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  scheduledStart: z
    .string()
    .min(1, "Choose a time slot")
    .refine((v) => new Date(v) > new Date(), "Choose a future time slot"),
});

export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;

export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  reason: z.string().trim().max(300).optional().or(z.literal("")),
});

export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;

export const updateAppointmentStatusSchema = z.object({
  appointmentId: z.string().uuid(),
  status: z.enum([
    "pending",
    "confirmed",
    "checked_in",
    "in_progress",
    "completed",
    "cancelled",
    "no_show",
  ]),
});

export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;

/**
 * Front-desk booking: schedules a future appointment for either a brand-new
 * patient (registered inline) or an existing hospital patient.
 */
export const receptionBookingSchema = z.object({
  doctorId: z.string().uuid("Select a doctor"),
  scheduledStart: z
    .string()
    .min(1, "Choose a time slot")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid time slot")
    .refine((v) => new Date(v) > new Date(), "Choose a future time slot"),
  reason: z.string().trim().max(500).optional().or(z.literal("")),
  patient: z.discriminatedUnion("mode", [
    z.object({
      mode: z.literal("existing"),
      patientId: z.string().uuid("Select a patient"),
    }),
    z.object({
      mode: z.literal("new"),
      fullName: z.string().trim().min(2, "Enter the patient's full name").max(120),
      dob: z.string().min(1, "Date of birth is required"),
      gender: genderEnum,
      phone: receptionPhoneSchema,
      email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
      address: z.string().trim().max(300).optional().or(z.literal("")),
    }),
  ]),
});

export type ReceptionBookingInput = z.infer<typeof receptionBookingSchema>;
