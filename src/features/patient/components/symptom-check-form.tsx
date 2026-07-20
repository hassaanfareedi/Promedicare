"use client";

import { useState, useTransition } from "react";
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

const COMMON_SYMPTOMS = [
  "Fever", "Cough", "Headache", "Fatigue", "Sore throat", "Shortness of breath",
  "Chest pain", "Nausea", "Dizziness", "Abdominal pain", "Joint pain", "Rash",
  "Vomiting", "Diarrhea", "Back pain", "Loss of appetite",
];

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
      toast.error(parsed.error.issues[0]?.message ?? "Please review your inputs");
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
        toast.warning("AI screening is temporarily unavailable — showing a safe placeholder.");
      } else {
        toast.success("Screening complete");
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
            <RotateCcw className="size-4" aria-hidden /> Run another check
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
          {step === "symptoms" ? "Step 1 — Your symptoms" : "Step 2 — Extra context (optional)"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {step === "symptoms"
            ? "Tap what matches how you feel. You can add detail on the next step or skip it."
            : "Duration, severity, and notes help refine the screening. Skip if you prefer."}
        </p>
      </CardHeader>
      <CardContent>
        {step === "symptoms" ? (
          <div className="space-y-6">
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Common symptoms</legend>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Common symptoms">
                {COMMON_SYMPTOMS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggle(s)}
                    aria-pressed={symptoms.includes(s)}
                    className={cn(
                      "min-h-10 rounded-full border px-3.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      symptoms.includes(s)
                        ? "border-teal-600 bg-teal-600 text-white"
                        : "border-input bg-background hover:bg-accent",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="custom-symptom">Add another symptom</Label>
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
                  <Plus className="size-4" aria-hidden /> Add
                </Button>
              </div>
              {symptoms.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {symptoms.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-sm text-teal-700 dark:bg-teal-950/50 dark:text-teal-300"
                    >
                      {s}
                      <button type="button" onClick={() => toggle(s)} aria-label={`Remove ${s}`}>
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
              title={symptoms.length === 0 ? "Select at least one symptom" : undefined}
              className="w-full"
              onClick={() => setStep("context")}
            >
              Continue
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
                  {s}
                </span>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days)</Label>
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
                  <Label htmlFor="age">Age</Label>
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
                  <Label>Age (from profile)</Label>
                  <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm tabular-nums">
                    {prefill.age}
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Severity</legend>
                <div className="flex gap-2" role="group" aria-label="Severity">
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
                      {s}
                    </button>
                  ))}
                </div>
              </fieldset>
              {(!demographicsLocked || !prefill?.sex) && (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Sex</legend>
                  <div className="flex gap-2" role="group" aria-label="Sex">
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
                        {s}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              {demographicsLocked && prefill?.sex && (
                <div className="space-y-2">
                  <Label>Sex (from profile)</Label>
                  <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm capitalize">
                    {prefill.sex}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Anything else? (optional)</Label>
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
                Analysing your symptoms… usually under 20 seconds.
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
                <ArrowLeft className="size-4" aria-hidden /> Back
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
                Skip & run
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
                {pending ? "Analysing…" : "Run AI screening"}
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Your screening is saved to your record and shared with your care team for review.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
