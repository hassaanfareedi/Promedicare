"use client";

import { CalendarPlus, Stethoscope, AlertTriangle, TrendingUp, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AiPrediction } from "@/schemas/prediction";
import { getRiskTone } from "@/lib/constants";
import type { RiskLevel } from "@/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AiDisclaimer } from "@/components/shared/ai-disclaimer";
import { ReliableNavLink } from "@/components/shared/reliable-nav-link";
import { buttonVariants } from "@/components/ui/button";

type Props = {
  prediction: AiPrediction;
  degraded?: boolean;
  bookHref?: string;
};

const KNOWN_RISKS: RiskLevel[] = ["low", "medium", "high", "urgent"];

export function PredictionResult({ prediction, degraded, bookHref }: Props) {
  const t = useTranslations("patient");
  const tRisk = useTranslations("risk");
  const riskKey = KNOWN_RISKS.includes(prediction.risk_level as RiskLevel)
    ? (prediction.risk_level as RiskLevel)
    : "unknown";
  const riskTone = getRiskTone(prediction.risk_level);
  const confidencePct = Math.round((prediction.confidence ?? 0) * 100);
  const showUrgent =
    prediction.risk_level === "urgent" ||
    (prediction.red_flags != null && prediction.red_flags.length > 0);

  return (
    <div className="space-y-4">
      <Card className={cn("border", riskTone.split(" ").filter((c) => c.includes("border")).join(" "))}>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="size-5 text-teal-600" /> {t("screeningResult")}
            </CardTitle>
            <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium", riskTone)}>
              {t("riskBadge", { level: tRisk(riskKey) })}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {degraded && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {t("degradedNotice")}
            </div>
          )}

          {showUrgent && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-900/70 dark:bg-red-950/40">
              <p className="flex items-center gap-2 text-sm font-semibold text-red-800 dark:text-red-200">
                <Phone className="size-4 shrink-0" aria-hidden />
                {t("urgentCareTitle")}
              </p>
              <p className="mt-1 text-sm text-red-700/90 dark:text-red-300/90">
                {t("urgentCareBody")}
              </p>
            </div>
          )}

          <div>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">{tRisk(`${riskKey}Desc`)}</p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {t("screeningConfidence", { pct: confidencePct })}
              </p>
            </div>
            <p className="text-sm leading-relaxed">{prediction.explanation}</p>
          </div>

          {prediction.predicted_conditions.length > 0 && (
            <div className="space-y-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="size-4 text-teal-600" /> {t("possibleConsiderations")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("relativeWeightNote")}
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
                        aria-valuetext={t("relativeWeightAria", { condition: c.condition, pct })}
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
                <AlertTriangle className="size-4" /> {t("redFlagsTitle")}
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
              <p className="text-xs text-muted-foreground">{t("recommendedSpecialist")}</p>
              <p className="font-medium">{prediction.recommended_specialty}</p>
            </div>
            {bookHref && (
              <ReliableNavLink href={bookHref} className={buttonVariants()}>
                <CalendarPlus className="size-4" /> {t("bookCta")}
              </ReliableNavLink>
            )}
          </div>
        </CardContent>
      </Card>

      <AiDisclaimer />
    </div>
  );
}
