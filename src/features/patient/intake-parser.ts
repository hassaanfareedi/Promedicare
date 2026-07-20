import type { Json } from "@/types/database";
import type { SymptomIntakeInput } from "@/schemas/prediction";

export type ParsedScreeningIntake = {
  symptoms: string[];
  durationDays?: number;
  severity?: "mild" | "moderate" | "severe";
  age?: number;
  sex?: "male" | "female" | "other";
  notes?: string | null;
};

/** Rebuild intake from stored prediction columns (supports legacy string[]). */
export function parseScreeningIntake(
  inputSymptoms: Json,
  inputText?: string | null,
): ParsedScreeningIntake {
  const notes = inputText?.trim() || null;

  if (Array.isArray(inputSymptoms)) {
    return {
      symptoms: inputSymptoms.map((s) => String(s)).filter(Boolean),
      notes,
    };
  }

  if (inputSymptoms && typeof inputSymptoms === "object" && !Array.isArray(inputSymptoms)) {
    const obj = inputSymptoms as Record<string, unknown>;
    const symptoms = Array.isArray(obj.symptoms)
      ? obj.symptoms.map((s) => String(s)).filter(Boolean)
      : [];
    const durationDays =
      typeof obj.durationDays === "number" && Number.isFinite(obj.durationDays)
        ? obj.durationDays
        : undefined;
    const severity =
      obj.severity === "mild" || obj.severity === "moderate" || obj.severity === "severe"
        ? obj.severity
        : undefined;
    const age =
      typeof obj.age === "number" && Number.isFinite(obj.age) ? obj.age : undefined;
    const sex =
      obj.sex === "male" || obj.sex === "female" || obj.sex === "other" ? obj.sex : undefined;
    return { symptoms, durationDays, severity, age, sex, notes };
  }

  return { symptoms: [], notes };
}

export function intakeToStoredJson(input: SymptomIntakeInput): Json {
  return {
    symptoms: input.symptoms,
    ...(typeof input.durationDays === "number" ? { durationDays: input.durationDays } : {}),
    ...(input.severity ? { severity: input.severity } : {}),
    ...(typeof input.age === "number" ? { age: input.age } : {}),
    ...(input.sex ? { sex: input.sex } : {}),
  } as unknown as Json;
}

export function ageFromDob(dob: string | null | undefined): number | undefined {
  if (!dob) return undefined;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  if (age < 0 || age > 120) return undefined;
  return age;
}

export function sexFromGender(
  gender: string | null | undefined,
): "male" | "female" | "other" | undefined {
  if (gender === "male" || gender === "female" || gender === "other") return gender;
  return undefined;
}

export function normalizeSpecialtyName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Match model specialty text to a known specialty id. */
export function matchSpecialtyId(
  recommended: string,
  specialties: { id: string; name: string }[],
): { id: string; name: string } | null {
  if (specialties.length === 0) return null;
  const target = normalizeSpecialtyName(recommended);
  if (!target) return null;

  const exact = specialties.find((s) => normalizeSpecialtyName(s.name) === target);
  if (exact) return exact;

  const contains = specialties.find((s) => {
    const n = normalizeSpecialtyName(s.name);
    return n.includes(target) || target.includes(n);
  });
  if (contains) return contains;

  const firstWord = target.split(" ")[0];
  if (firstWord && firstWord.length >= 4) {
    const byWord = specialties.find((s) =>
      normalizeSpecialtyName(s.name).split(" ").includes(firstWord),
    );
    if (byWord) return byWord;
  }

  return null;
}
