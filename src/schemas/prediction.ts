import { z } from "zod";

/** Patient-provided symptom intake. */
export const symptomIntakeSchema = z.object({
  symptoms: z
    .array(z.string().trim().min(1))
    .min(1, "Select or add at least one symptom")
    .max(30, "That is a lot of symptoms — please focus on the most relevant"),
  durationDays: z.coerce.number().int().min(0).max(3650).optional(),
  severity: z.enum(["mild", "moderate", "severe"]).optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  age: z.coerce.number().int().min(0).max(120).optional(),
  sex: z.enum(["male", "female", "other"]).optional(),
});

export type SymptomIntakeInput = z.infer<typeof symptomIntakeSchema>;

/**
 * Strict schema for the JSON the Groq model MUST return. Any deviation is
 * rejected server-side and replaced with a safe fallback — the raw model
 * output is never trusted or persisted without passing this gate.
 */
export const aiPredictionSchema = z.object({
  predicted_conditions: z
    .array(
      z.object({
        condition: z.string().min(1).max(120),
        likelihood: z.number().min(0).max(1),
      }),
    )
    .min(1)
    .max(5),
  confidence: z.number().min(0).max(1),
  risk_level: z.enum(["low", "medium", "high", "urgent"]),
  explanation: z.string().min(1).max(2000),
  recommended_specialty: z.string().min(1).max(80),
  red_flags: z.array(z.string().max(200)).max(10).optional().default([]),
});

export type AiPrediction = z.infer<typeof aiPredictionSchema>;

/** Doctor review of a stored prediction. */
export const predictionReviewSchema = z.object({
  predictionId: z.string().uuid(),
  status: z.enum(["reviewed", "dismissed"]),
  reviewNotes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type PredictionReviewInput = z.infer<typeof predictionReviewSchema>;
