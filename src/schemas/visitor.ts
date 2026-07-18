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
