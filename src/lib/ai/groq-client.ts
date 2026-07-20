import "server-only";
import { z } from "zod";
import {
  aiPredictionSchema,
  clinicalBriefSchema,
  type AiPrediction,
  type ClinicalBrief,
  type SymptomIntakeInput,
} from "@/schemas/prediction";
import {
  SYMPTOM_SYSTEM_PROMPT,
  CLINICAL_BRIEF_SYSTEM_PROMPT,
  buildSymptomUserPrompt,
  buildClinicalBriefUserPrompt,
} from "@/lib/ai/prompts";
import type { ParsedScreeningIntake } from "@/features/patient/intake-parser";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type GroqResult<T> =
  | { ok: true; data: T; model: string }
  | { ok: false; error: string };

function getConfig() {
  const apiKey = process.env.GROQ_API_KEY;
  const baseUrl = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  return { apiKey, baseUrl, model };
}

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

/**
 * Single choke point for every Groq call. Requests JSON-only output, then
 * validates it against a Zod schema before returning. Never trusts raw output.
 */
async function callGroqJSON<T>(
  schema: z.ZodType<T>,
  messages: ChatMessage[],
  { retries = 1, temperature = 0.2 }: { retries?: number; temperature?: number } = {},
): Promise<GroqResult<T>> {
  const { apiKey, baseUrl, model } = getConfig();
  if (!apiKey) return { ok: false, error: "AI is not configured (missing GROQ_API_KEY)." };

  let lastError = "Unknown error";

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20_000);
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature,
          response_format: { type: "json_object" },
          messages,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        lastError = `AI service responded with ${res.status}`;
        continue;
      }

      const payload = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) {
        lastError = "AI returned an empty response";
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        lastError = "AI returned malformed JSON";
        continue;
      }

      const result = schema.safeParse(parsed);
      if (!result.success) {
        lastError = "AI response failed validation";
        continue;
      }

      return { ok: true, data: result.data, model };
    } catch (err) {
      lastError = err instanceof Error && err.name === "AbortError" ? "AI request timed out" : "AI request failed";
    }
  }

  return { ok: false, error: lastError };
}

/** Safe fallback used whenever the AI is unavailable or returns invalid data. */
export function fallbackPrediction(): AiPrediction {
  return {
    predicted_conditions: [{ condition: "Unspecified — needs clinical assessment", likelihood: 1 }],
    confidence: 0,
    risk_level: "medium",
    explanation:
      "We couldn't generate an automated screening right now. This does not reflect your health status. Please consult a licensed medical professional, and book an appointment if your symptoms are concerning.",
    recommended_specialty: "General Medicine",
    red_flags: [],
  };
}

export type SymptomPrediction = {
  prediction: AiPrediction;
  model: string;
  degraded: boolean;
};

/** Runs symptom-based risk screening. Always returns a usable result. */
export async function runSymptomPrediction(
  input: SymptomIntakeInput,
  specialtyNames: string[] = [],
): Promise<SymptomPrediction> {
  const names =
    specialtyNames.length > 0
      ? specialtyNames
      : ["General Medicine"];
  const result = await callGroqJSON(aiPredictionSchema, [
    { role: "system", content: SYMPTOM_SYSTEM_PROMPT },
    { role: "user", content: buildSymptomUserPrompt(input, names) },
  ]);

  if (result.ok) {
    let prediction = result.data;
    // Snap specialty to an allowed name when the model drifts slightly.
    const matched = names.find(
      (n) => n.trim().toLowerCase() === prediction.recommended_specialty.trim().toLowerCase(),
    );
    if (!matched) {
      const fuzzy = names.find((n) => {
        const a = n.trim().toLowerCase();
        const b = prediction.recommended_specialty.trim().toLowerCase();
        return a.includes(b) || b.includes(a);
      });
      prediction = {
        ...prediction,
        recommended_specialty: fuzzy ?? names[0] ?? "General Medicine",
      };
    } else {
      prediction = { ...prediction, recommended_specialty: matched };
    }
    return { prediction, model: result.model, degraded: false };
  }
  const fallback = fallbackPrediction();
  return {
    prediction: {
      ...fallback,
      recommended_specialty: names[0] ?? fallback.recommended_specialty,
    },
    model: getConfig().model,
    degraded: true,
  };
}

export type ClinicalBriefResult =
  | { ok: true; brief: ClinicalBrief; model: string }
  | { ok: false; error: string };

/** Generates a clinician brief from intake + prediction. Does not fall back silently. */
export async function runClinicalBrief(args: {
  intake: ParsedScreeningIntake;
  prediction: AiPrediction;
}): Promise<ClinicalBriefResult> {
  const result = await callGroqJSON(clinicalBriefSchema, [
    { role: "system", content: CLINICAL_BRIEF_SYSTEM_PROMPT },
    { role: "user", content: buildClinicalBriefUserPrompt(args) },
  ]);
  if (result.ok) return { ok: true, brief: result.data, model: result.model };
  return { ok: false, error: result.error };
}

/** Minimal structured "hello world" used to verify the key/model once set. */
export async function verifyGroq(): Promise<GroqResult<{ status: string }>> {
  return callGroqJSON(
    z.object({ status: z.string() }),
    [
      { role: "system", content: 'Return ONLY {"status":"ok"} as JSON.' },
      { role: "user", content: "ping" },
    ],
    { retries: 0 },
  );
}
