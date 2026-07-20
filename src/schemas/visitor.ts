import { z } from "zod";

/**
 * Public visitor lookup: requires the patient code PLUS a second factor
 * (date of birth OR registered phone). This prevents record disclosure from a
 * guessable/enumerable id alone.
 */
export const visitorLookupSchema = z
  .object({
    patientCode: z
      .string()
      .trim()
      .toUpperCase()
      .min(4, "Enter a valid patient ID")
      .max(32)
      .regex(/^PMC-\d{4,}$/i, "Patient ID looks like PMC-123456"),
    dob: z.string().optional().or(z.literal("")),
    phone: z.string().trim().optional().or(z.literal("")),
  })
  .refine((data) => Boolean(data.dob) || Boolean(data.phone), {
    message: "Provide date of birth or registered phone to verify identity",
    path: ["dob"],
  });

export type VisitorLookupInput = z.infer<typeof visitorLookupSchema>;

const appointmentStatusSchema = z.enum([
  "pending",
  "confirmed",
  "checked_in",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
]);

/**
 * Shape of the `visitor_lookup` RPC payload. It comes back as untyped JSON, so
 * we validate it before trusting it as a VisitorRecord.
 */
export const visitorRecordSchema = z.object({
  patientCode: z.string(),
  fullName: z.string(),
  registeredHospital: z.string().nullable(),
  nextAppointment: z
    .object({
      date: z.string(),
      status: appointmentStatusSchema,
      doctor: z.string().nullable(),
      department: z.string().nullable(),
    })
    .nullable(),
  recentHistory: z.array(
    z.object({
      date: z.string(),
      status: appointmentStatusSchema,
      doctor: z.string().nullable(),
    }),
  ),
});
