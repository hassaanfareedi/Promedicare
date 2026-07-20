import Link from "next/link";
import { CalendarPlus, Stethoscope, AlertTriangle, TrendingUp, Phone } from "lucide-react";
import type { AiPrediction } from "@/schemas/prediction";
import { RISK_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AiDisclaimer } from "@/components/shared/ai-disclaimer";
import { buttonVariants } from "@/components/ui/button";

type Props = {
  prediction: AiPrediction;
  degraded?: boolean;
  bookHref?: string;
};

export function PredictionResult({ prediction, degraded, bookHref }: Props) {
  const risk = RISK_META[prediction.risk_level];
  const confidencePct = Math.round((prediction.confidence ?? 0) * 100);
  const showUrgent =
    prediction.risk_level === "urgent" ||
    (prediction.red_flags != null && prediction.red_flags.length > 0);

  return (
    <div className="space-y-4">
      <Card className={cn("border", risk.tone.split(" ").filter((c) => c.includes("border")).join(" "))}>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="size-5 text-teal-600" /> Screening result
            </CardTitle>
            <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium", risk.tone)}>
              {risk.label} risk
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {degraded && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              AI screening is temporarily unavailable, so this is a conservative placeholder. Please
              consult a professional.
            </div>
          )}

          {showUrgent && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-900/70 dark:bg-red-950/40">
              <p className="flex items-center gap-2 text-sm font-semibold text-red-800 dark:text-red-200">
                <Phone className="size-4 shrink-0" aria-hidden />
                Seek emergency or urgent care now if symptoms are severe or worsening
              </p>
              <p className="mt-1 text-sm text-red-700/90 dark:text-red-300/90">
                This screening is not a substitute for emergency services. Call your local emergency
                number or go to the nearest ER when in doubt.
              </p>
            </div>
          )}

          <div>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">{risk.description}</p>
              <p className="text-xs tabular-nums text-muted-foreground">
                Screening confidence {confidencePct}%
              </p>
            </div>
            <p className="text-sm leading-relaxed">{prediction.explanation}</p>
          </div>

          {prediction.predicted_conditions.length > 0 && (
            <div className="space-y-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="size-4 text-teal-600" /> Possible considerations
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Relative weight among listed considerations — not disease probability.
                </p>
              </div>
              <ul className="space-y-2.5">
                {prediction.predicted_conditions.map((c, i) => {
                  const pct = Math.round(c.likelihood * 100);
                  return (
                    <li key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span id={`cond-${i}`}>{c.condition}</span>
                        <span className="tabular-nums text-muted-foreground">{pct}%</span>
                      </div>
                      <Progress
                        value={pct}
                        aria-labelledby={`cond-${i}`}
                        aria-valuetext={`${c.condition} relative weight ${pct} percent`}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {prediction.red_flags && prediction.red_flags.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-950/30">
              <p className="mb-1.5 flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-300">
                <AlertTriangle className="size-4" /> Seek care promptly if you notice
              </p>
              <ul className="list-inside list-disc space-y-0.5 text-sm text-red-700/90 dark:text-red-300/90">
                {prediction.red_flags.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Recommended specialist</p>
              <p className="font-medium">{prediction.recommended_specialty}</p>
            </div>
            {bookHref && (
              <Link href={bookHref} className={buttonVariants()}>
                <CalendarPlus className="size-4" /> Book appointment
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      <AiDisclaimer />
    </div>
  );
}
