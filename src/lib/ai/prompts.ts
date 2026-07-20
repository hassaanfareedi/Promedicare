import type { AiPrediction, SymptomIntakeInput } from "@/schemas/prediction";
import type { ParsedScreeningIntake } from "@/features/patient/intake-parser";

export const SYMPTOM_SYSTEM_PROMPT = `You are a clinical decision-support assistant for ProMediCare AI.
You perform EARLY RISK SCREENING based on self-reported symptoms. You are NOT a doctor and you do NOT diagnose.

Rules:
- Return ONLY a single JSON object. No prose, no markdown, no code fences.
- Base your assessment only on the information provided; never invent patient data.
- Be cautious and safety-first: when symptoms could indicate a serious condition, raise the risk level.
- "confidence" is your overall confidence in the screening (0..1), NOT a probability of disease.
- "likelihood" for each condition is a relative 0..1 weighting across your listed conditions (not disease probability).
- "recommended_specialty" MUST be copied exactly from the allowed specialty list provided in the user message.
- "red_flags" lists any symptoms that warrant urgent in-person care, if present.

The JSON schema you MUST follow exactly:
{
  "predicted_conditions": [{ "condition": string, "likelihood": number (0..1) }], // 1 to 5 items
  "confidence": number (0..1),
  "risk_level": "low" | "medium" | "high" | "urgent",
  "explanation": string, // plain language, <= 120 words, no diagnosis language
  "recommended_specialty": string, // exact name from the allowed list
  "red_flags": string[] // possibly empty
}`;

export function buildSymptomUserPrompt(
  input: SymptomIntakeInput,
  specialtyNames: string[],
): string {
  const lines: string[] = [];
  lines.push(`Symptoms: ${input.symptoms.join(", ")}`);
  if (typeof input.durationDays === "number") lines.push(`Duration: ${input.durationDays} day(s)`);
  if (input.severity) lines.push(`Reported severity: ${input.severity}`);
  if (typeof input.age === "number") lines.push(`Age: ${input.age}`);
  if (input.sex) lines.push(`Sex: ${input.sex}`);
  if (input.notes) lines.push(`Additional notes: ${input.notes}`);
  if (specialtyNames.length > 0) {
    lines.push(`\nAllowed specialties (pick exactly one): ${specialtyNames.join(", ")}`);
  } else {
    lines.push('\nAllowed specialties (pick exactly one): General Medicine');
  }
  lines.push("\nReturn the screening as a single JSON object following the schema exactly.");
  return lines.join("\n");
}

export const CLINICAL_BRIEF_SYSTEM_PROMPT = `You are a clinical decision-support assistant for ProMediCare AI.
You write a SHORT clinician-oriented brief from an AI symptom screening. You are NOT diagnosing.

Rules:
- Return ONLY a single JSON object. No prose, no markdown, no code fences.
- Be concise, factual, and safety-first. Do not invent findings not present in the input.
- Do not use definitive diagnosis language ("the patient has X"). Prefer "consider", "suggests", "may warrant".
- Keep each bullet under 25 words.

The JSON schema you MUST follow exactly:
{
  "chief_symptoms": string, // one short line summarizing reported symptoms
  "risk_rationale": string, // why the risk level was assigned
  "red_flags": string[], // empty if none
  "suggested_focus": string // what a clinician might prioritize on review
}`;

export function buildClinicalBriefUserPrompt(args: {
  intake: ParsedScreeningIntake;
  prediction: AiPrediction;
}): string {
  const { intake, prediction } = args;
  const lines: string[] = [];
  lines.push(`Symptoms: ${intake.symptoms.join(", ") || "none listed"}`);
  if (typeof intake.durationDays === "number") lines.push(`Duration: ${intake.durationDays} day(s)`);
  if (intake.severity) lines.push(`Severity: ${intake.severity}`);
  if (typeof intake.age === "number") lines.push(`Age: ${intake.age}`);
  if (intake.sex) lines.push(`Sex: ${intake.sex}`);
  if (intake.notes) lines.push(`Patient notes: ${intake.notes}`);
  lines.push(`Risk level: ${prediction.risk_level}`);
  lines.push(`Confidence: ${prediction.confidence}`);
  lines.push(`Explanation: ${prediction.explanation}`);
  lines.push(
    `Conditions: ${prediction.predicted_conditions.map((c) => `${c.condition} (${c.likelihood})`).join("; ")}`,
  );
  lines.push(`Recommended specialty: ${prediction.recommended_specialty}`);
  if (prediction.red_flags?.length) {
    lines.push(`Model red flags: ${prediction.red_flags.join("; ")}`);
  }
  lines.push("\nReturn the clinical brief as a single JSON object following the schema exactly.");
  return lines.join("\n");
}
