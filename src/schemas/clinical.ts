import { z } from "zod";

export const medicationLineSchema = z.object({
  name: z.string().trim().min(1, "Medication name is required").max(120),
  dose: z.string().trim().max(80).optional().or(z.literal("")),
  frequency: z.string().trim().max(80).optional().or(z.literal("")),
  duration: z.string().trim().max(80).optional().or(z.literal("")),
  instructions: z.string().trim().max(200).optional().or(z.literal("")),
});

export type MedicationLine = z.infer<typeof medicationLineSchema>;

export const completeConsultationSchema = z.object({
  appointmentId: z.string().uuid(),
  subjective: z.string().trim().min(1, "Subjective notes are required").max(4000),
  objective: z.string().trim().min(1, "Objective notes are required").max(4000),
  assessment: z.string().trim().min(1, "Assessment is required").max(4000),
  diagnosis: z.string().trim().min(1, "Diagnosis is required").max(500),
  plan: z.string().trim().min(1, "Plan is required").max(4000),
  prescription: z.string().trim().min(1, "Prescription instructions are required").max(4000),
  medications: z.array(medicationLineSchema).max(20).optional().default([]),
});

export type CompleteConsultationInput = z.infer<typeof completeConsultationSchema>;

export const checkInWithFeeSchema = z.object({
  appointmentId: z.string().uuid(),
  amount: z.coerce.number().min(0, "Amount cannot be negative").max(1_000_000),
  method: z.enum(["cash", "card", "other"]),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
  currency: z.string().trim().min(3).max(3).optional().default("PKR"),
});

export type CheckInWithFeeInput = z.infer<typeof checkInWithFeeSchema>;

export const attachmentMetaSchema = z.object({
  appointmentId: z.string().uuid(),
  patientId: z.string().uuid(),
  kind: z.enum(["lab", "imaging", "other"]).default("other"),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().max(120).optional(),
});

export type AttachmentMetaInput = z.infer<typeof attachmentMetaSchema>;
