import { aiPredictionSchema, type AiPrediction } from "@/schemas/prediction";
import type { PredictedCondition, Prediction, RiskLevel } from "@/types";

/**
 * Reconstructs a validated `AiPrediction` from a stored prediction row. Prefers
 * the raw model output, falling back to the normalised columns.
 */
export function toAiPrediction(row: Prediction): AiPrediction {
  const fromRaw = aiPredictionSchema.safeParse(row.raw_output);
  if (fromRaw.success) return fromRaw.data;

  const conditions = Array.isArray(row.predicted_conditions)
    ? (row.predicted_conditions as unknown as PredictedCondition[])
    : [];

  return {
    predicted_conditions:
      conditions.length > 0
        ? conditions.map((c) => ({
            condition: String(c.condition ?? "Unspecified"),
            likelihood: typeof c.likelihood === "number" ? c.likelihood : 0,
          }))
        : [{ condition: "Unspecified", likelihood: 0 }],
    confidence: row.confidence ?? 0,
    risk_level: row.risk_level as RiskLevel,
    explanation: row.explanation ?? "No explanation was recorded for this screening.",
    recommended_specialty: row.recommended_specialty_label ?? "General Medicine",
    red_flags: [],
  };
}
