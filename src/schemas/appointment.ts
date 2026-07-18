import { z } from "zod";

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
