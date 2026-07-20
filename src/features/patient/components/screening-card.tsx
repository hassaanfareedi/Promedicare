"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import type { AiPrediction } from "@/schemas/prediction";
import { RiskBadge } from "@/components/shared/risk-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PredictionResult } from "@/features/patient/components/prediction-result";
import { formatDateTime } from "@/lib/format";
import type { PredictionStatus, RiskLevel } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  prediction: AiPrediction;
  predictionId: string;
  specialtyId?: string | null;
  createdAt: string;
  status: PredictionStatus;
  reviewNotes?: string | null;
};

function statusMeta(status: PredictionStatus) {
  if (status === "reviewed") {
    return {
      label: "Reviewed",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    };
  }
  if (status === "dismissed") {
    return {
      label: "Dismissed",
      className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    };
  }
  return {
    label: "Pending review",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  };
}

export function ScreeningCard({
  prediction,
  predictionId,
  specialtyId,
  createdAt,
  status,
  reviewNotes,
}: Props) {
  const [open, setOpen] = useState(false);
  const params = new URLSearchParams();
  if (specialtyId) params.set("specialty", specialtyId);
  params.set("prediction", predictionId);
  const bookHref = `/patient/appointments/new?${params.toString()}`;
  const meta = statusMeta(status);

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">{prediction.recommended_specialty}</p>
            <RiskBadge level={prediction.risk_level as RiskLevel} />
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                meta.className,
              )}
            >
              {meta.label}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{formatDateTime(createdAt)}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button variant="outline" size="sm">
                <Eye className="size-4" aria-hidden /> View
              </Button>
            }
          />
          <DialogContent className="max-h-[85vh] overflow-y-auto overscroll-contain sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Screening details</DialogTitle>
              <DialogDescription>AI screening result from {formatDateTime(createdAt)}.</DialogDescription>
            </DialogHeader>
            <PredictionResult prediction={prediction} bookHref={bookHref} />
            {(status === "reviewed" || status === "dismissed") && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <p className="font-medium">Clinician {meta.label.toLowerCase()}</p>
                {reviewNotes?.trim() ? (
                  <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{reviewNotes}</p>
                ) : (
                  <p className="mt-1 text-muted-foreground">No notes were added.</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
