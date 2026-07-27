"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Stethoscope, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import type { AiPrediction, ClinicalBrief } from "@/schemas/prediction";
import type { ParsedScreeningIntake } from "@/features/patient/intake-parser";
import { ensureClinicalSummary, reviewPrediction } from "@/features/doctor/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PredictionResult } from "@/features/patient/components/prediction-result";
import { ScreeningIntakeSummary } from "@/features/patient/components/screening-intake-summary";
import { cn } from "@/lib/utils";

type Props = {
  predictionId: string;
  prediction: AiPrediction;
  intake: ParsedScreeningIntake;
  patientName: string;
  alreadyReviewed: boolean;
  initialBrief?: ClinicalBrief | null;
};

function ClinicalBriefPanel({
  brief,
  loading,
  error,
  onRetry,
}: {
  brief: ClinicalBrief | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const t = useTranslations("doctor");
  const tc = useTranslations("common");
  return (
    <div className="rounded-lg border border-teal-200/80 bg-teal-50/50 p-3 dark:border-teal-900/50 dark:bg-teal-950/30">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-teal-800 dark:text-teal-300">
          {t("aiClinicalBrief")}
        </p>
        {error && (
          <Button type="button" size="sm" variant="ghost" onClick={onRetry}>
            <RefreshCw className="size-3.5" aria-hidden /> {tc("retry")}
          </Button>
        )}
      </div>
      {loading && !brief && (
        <div className="mt-2 space-y-2" aria-busy="true">
          <div className="h-3 w-[80%] animate-pulse rounded bg-teal-200/60 dark:bg-teal-800/40" />
          <div className="h-3 w-full animate-pulse rounded bg-teal-200/60 dark:bg-teal-800/40" />
          <div className="h-3 w-[60%] animate-pulse rounded bg-teal-200/60 dark:bg-teal-800/40" />
        </div>
      )}
      {error && !brief && (
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      )}
      {brief && (
        <dl className="mt-2 space-y-2 text-sm">
          <div>
            <dt className="font-medium">{t("chiefSymptoms")}</dt>
            <dd className="text-muted-foreground">{brief.chief_symptoms}</dd>
          </div>
          <div>
            <dt className="font-medium">{t("riskRationale")}</dt>
            <dd className="text-muted-foreground">{brief.risk_rationale}</dd>
          </div>
          {brief.red_flags.length > 0 && (
            <div>
              <dt className="font-medium">{t("redFlags")}</dt>
              <dd>
                <ul className="list-inside list-disc text-muted-foreground">
                  {brief.red_flags.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          <div>
            <dt className="font-medium">{t("suggestedFocus")}</dt>
            <dd className="text-muted-foreground">{brief.suggested_focus}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}

export function ReviewDialog({
  predictionId,
  prediction,
  intake,
  patientName,
  alreadyReviewed,
  initialBrief = null,
}: Props) {
  const router = useRouter();
  const t = useTranslations("doctor");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [decision, setDecision] = useState<"reviewed" | "dismissed">("reviewed");
  const [notes, setNotes] = useState("");
  const [brief, setBrief] = useState<ClinicalBrief | null>(initialBrief);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  // Ensures only the latest brief request applies (manual retry + auto-load can race).
  const briefReqId = useRef(0);

  function loadBrief() {
    const reqId = ++briefReqId.current;
    setBriefLoading(true);
    setBriefError(null);
    startTransition(async () => {
      const res = await ensureClinicalSummary(predictionId);
      if (reqId !== briefReqId.current) return;
      setBriefLoading(false);
      if (!res.ok) {
        setBriefError(res.error);
        return;
      }
      setBrief(res.data.brief);
    });
  }

  useEffect(() => {
    if (!open || brief || briefLoading || briefError) return;
    const reqId = ++briefReqId.current;
    let active = true;
    setBriefLoading(true);
    void ensureClinicalSummary(predictionId).then((res) => {
      if (!active || reqId !== briefReqId.current) return;
      setBriefLoading(false);
      if (!res.ok) {
        setBriefError(res.error);
        return;
      }
      setBrief(res.data.brief);
    });
    return () => {
      // Invalidate this request so a late resolve/reopen can't apply stale data.
      active = false;
    };
  }, [open, brief, briefLoading, briefError, predictionId]);

  function submit() {
    startTransition(async () => {
      const res = await reviewPrediction({ predictionId, status: decision, reviewNotes: notes || undefined });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(t("reviewSaved"));
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant={alreadyReviewed ? "outline" : "default"}>
            <Stethoscope className="size-4" /> {alreadyReviewed ? t("view") : t("review")}
          </Button>
        }
      />
      <DialogContent className="max-h-[88vh] overflow-y-auto overscroll-contain sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("screeningTitle", { name: patientName })}</DialogTitle>
          <DialogDescription>
            {alreadyReviewed
              ? t("viewScreeningDesc")
              : t("reviewScreeningDesc")}
          </DialogDescription>
        </DialogHeader>

        <ScreeningIntakeSummary intake={intake} />
        <ClinicalBriefPanel
          brief={brief}
          loading={briefLoading || pending}
          error={briefError}
          onRetry={loadBrief}
        />
        <PredictionResult prediction={prediction} />

        {!alreadyReviewed && (
          <div className="space-y-3 border-t pt-4">
            <Label>{t("decision")}</Label>
            <div className="flex gap-2">
              <button
                type="button"
                aria-pressed={decision === "reviewed"}
                onClick={() => setDecision("reviewed")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                  decision === "reviewed"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-input hover:bg-accent",
                )}
              >
                <CheckCircle2 className="size-4" aria-hidden /> {t("acknowledge")}
              </button>
              <button
                type="button"
                aria-pressed={decision === "dismissed"}
                onClick={() => setDecision("dismissed")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                  decision === "dismissed"
                    ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                    : "border-input hover:bg-accent",
                )}
              >
                <XCircle className="size-4" aria-hidden /> {t("dismiss")}
              </button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-notes">{t("notesOptional")}</Label>
              <Textarea
                id="review-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Clinical notes for the record"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={submit} disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : null}
                {t("saveReview")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
