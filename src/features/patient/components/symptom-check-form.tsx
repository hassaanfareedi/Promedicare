"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Plus, X, Activity, RotateCcw, ArrowLeft, ArrowRight } from "lucide-react";
import { runScreening, type ScreeningResult } from "@/features/patient/actions";
import { symptomIntakeSchema } from "@/schemas/prediction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PredictionResult } from "@/features/patient/components/prediction-result";

const COMMON_SYMPTOMS: { value: string; key: string }[] = [
  { value: "Fever", key: "fever" },
  { value: "Cough", key: "cough" },
  { value: "Headache", key: "headache" },
  { value: "Fatigue", key: "fatigue" },
  { value: "Sore throat", key: "soreThroat" },
  { value: "Shortness of breath", key: "shortnessOfBreath" },
  { value: "Chest pain", key: "chestPain" },
  { value: "Nausea", key: "nausea" },
  { value: "Dizziness", key: "dizziness" },
  { value: "Abdominal pain", key: "abdominalPain" },
  { value: "Joint pain", key: "jointPain" },
  { value: "Rash", key: "rash" },
  { value: "Vomiting", key: "vomiting" },
  { value: "Diarrhea", key: "diarrhea" },
  { value: "Back pain", key: "backPain" },
  { value: "Loss of appetite", key: "lossOfAppetite" },
];

const SYMPTOM_KEYS: Record<string, string> = Object.fromEntries(
  COMMON_SYMPTOMS.map((s) => [s.value, s.key]),
);

const SEVERITIES = ["mild", "moderate", "severe"] as const;
const SEXES = ["male", "female", "other"] as const;

export type SymptomCheckPrefill = {
  age?: number;
  sex?: "male" | "female" | "other";
};

type Props = {
  prefill?: SymptomCheckPrefill;
};

export function SymptomCheckForm({ prefill }: Props) {
  const t = useTranslations("patient");
  const tc = useTranslations("common");
  const symptomLabel = (value: string) =>
    SYMPTOM_KEYS[value] ? t(`symptoms.${SYMPTOM_KEYS[value]}`) : value;
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [step, setStep] = useState<"symptoms" | "context">("symptoms");

  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number] | "">("");
  const [sex, setSex] = useState<(typeof SEXES)[number] | "">(prefill?.sex ?? "");
  const [age, setAge] = useState(prefill?.age != null ? String(prefill.age) : "");
  const [notes, setNotes] = useState("");

  const demographicsLocked = Boolean(prefill?.age != null || prefill?.sex);

  function toggle(symptom: string) {
    setSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom],
    );
  }

  function addCustom() {
    const v = custom.trim();
    if (!v) return;
    if (!symptoms.includes(v)) setSymptoms((prev) => [...prev, v]);
    setCustom("");
  }

  function reset() {
    setResult(null);
    setStep("symptoms");
    setSymptoms([]);
    setCustom("");
    setDurationDays("");
    setSeverity("");
    setSex(prefill?.sex ?? "");
    setAge(prefill?.age != null ? String(prefill.age) : "");
    setNotes("");
  }

  function runCheck(includeContext: boolean) {
    const payload = {
      symptoms,
      durationDays: includeContext && durationDays ? Number(durationDays) : undefined,
      severity: includeContext && severity ? severity : undefined,
      sex: sex || undefined,
      age: age ? Number(age) : undefined,
      notes: includeContext && notes ? notes : undefined,
    };
    const parsed = symptomIntakeSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? t("reviewInputs"));
      return;
    }
    startTransition(async () => {
      const res = await runScreening(parsed.data);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setResult(res.data);
      if (res.data.degraded) {
        toast.warning(t("screeningDegradedToast"));
      } else {
        toast.success(t("screeningComplete"));
      }
    });
  }

  if (result) {
    const params = new URLSearchParams();
    if (result.recommendedSpecialtyId) params.set("specialty", result.recommendedSpecialtyId);
    params.set("prediction", result.predictionId);
    return (
      <div className="space-y-4">
        <PredictionResult
          prediction={result.prediction}
          degraded={result.degraded}
          bookHref={`/patient/appointments/new?${params.toString()}`}
        />
        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={reset}>
            <RotateCcw className="size-4" aria-hidden /> {t("runAnother")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-5 text-teal-600" aria-hidden />
          {step === "symptoms" ? t("step1Title") : t("step2Title")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {step === "symptoms" ? t("step1Desc") : t("step2Desc")}
        </p>
      </CardHeader>
      <CardContent>
        {step === "symptoms" ? (
          <div className="space-y-6">
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">{t("commonSymptoms")}</legend>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("commonSymptoms")}>
                {COMMON_SYMPTOMS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggle(s.value)}
                    aria-pressed={symptoms.includes(s.value)}
                    className={cn(
                      "min-h-10 rounded-full border px-3.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      symptoms.includes(s.value)
                        ? "border-teal-600 bg-teal-600 text-white"
                        : "border-input bg-background hover:bg-accent",
                    )}
                  >
                    {symptomLabel(s.value)}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="custom-symptom">{t("addSymptom")}</Label>
              <div className="flex gap-2">
                <Input
                  id="custom-symptom"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustom();
                    }
                  }}
                  placeholder="e.g. blurred vision"
                />
                <Button type="button" variant="outline" onClick={addCustom}>
                  <Plus className="size-4" aria-hidden /> {t("add")}
                </Button>
              </div>
              {symptoms.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {symptoms.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-sm text-teal-700 dark:bg-teal-950/50 dark:text-teal-300"
                    >
                      {symptomLabel(s)}
                      <button
                        type="button"
                        onClick={() => toggle(s)}
                        aria-label={t("removeSymptom", { symptom: symptomLabel(s) })}
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="button"
              disabled={symptoms.length === 0}
              title={symptoms.length === 0 ? t("selectSymptomHint") : undefined}
              className="w-full"
              onClick={() => setStep("context")}
            >
              {t("continue")}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {symptoms.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-teal-50 px-2.5 py-1 text-sm text-teal-700 dark:bg-teal-950/50 dark:text-teal-300"
                >
                  {symptomLabel(s)}
                </span>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration">{t("durationDays")}</Label>
                <Input
                  id="duration"
                  type="number"
                  min={0}
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  placeholder="e.g. 3"
                />
              </div>
              {(!demographicsLocked || !prefill?.age) && (
                <div className="space-y-2">
                  <Label htmlFor="age">{t("age")}</Label>
                  <Input
                    id="age"
                    type="number"
                    min={0}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 34"
                  />
                </div>
              )}
              {demographicsLocked && prefill?.age != null && (
                <div className="space-y-2">
                  <Label>{t("ageFromProfile")}</Label>
                  <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm tabular-nums">
                    {prefill.age}
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">{t("severity")}</legend>
                <div className="flex gap-2" role="group" aria-label={t("severity")}>
                  {SEVERITIES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={severity === s}
                      onClick={() => setSeverity(severity === s ? "" : s)}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        severity === s
                          ? "border-teal-600 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                          : "border-input hover:bg-accent",
                      )}
                    >
                      {t(`severityOptions.${s}`)}
                    </button>
                  ))}
                </div>
              </fieldset>
              {(!demographicsLocked || !prefill?.sex) && (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">{t("sex")}</legend>
                  <div className="flex gap-2" role="group" aria-label={t("sex")}>
                    {SEXES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={sex === s}
                        onClick={() => setSex(sex === s ? "" : s)}
                        className={cn(
                          "flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          sex === s
                            ? "border-teal-600 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                            : "border-input hover:bg-accent",
                        )}
                      >
                        {t(`sexOptions.${s}`)}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              {demographicsLocked && prefill?.sex && (
                <div className="space-y-2">
                  <Label>{t("sexFromProfile")}</Label>
                  <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm capitalize">
                    {t(`sexOptions.${prefill.sex}`)}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t("notesLabel")}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Describe how you're feeling, any relevant history, medications, etc."
                maxLength={1000}
              />
            </div>

            {pending && (
              <p className="text-center text-sm text-muted-foreground" role="status">
                {t("analysingLong")}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setStep("symptoms")}
                className="sm:flex-1"
              >
                <ArrowLeft className="size-4" aria-hidden /> {tc("back")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => runCheck(false)}
                className="sm:flex-1"
                aria-busy={pending}
              >
                {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                {t("skipAndRun")}
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={() => runCheck(true)}
                className="sm:flex-1"
                aria-busy={pending}
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Activity className="size-4" aria-hidden />
                )}
                {pending ? t("analysingShort") : t("runScreening")}
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {t("screeningSavedNote")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
