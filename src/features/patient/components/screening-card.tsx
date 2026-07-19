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
import type { RiskLevel } from "@/types";

type Props = {
  prediction: AiPrediction;
  predictionId: string;
  specialtyId?: string | null;
  createdAt: string;
  reviewed: boolean;
};

export function ScreeningCard({
  prediction,
  predictionId,
  specialtyId,
  createdAt,
  reviewed,
}: Props) {
  const [open, setOpen] = useState(false);
  const params = new URLSearchParams();
  if (specialtyId) params.set("specialty", specialtyId);
  params.set("prediction", predictionId);
  const bookHref = `/patient/appointments/new?${params.toString()}`;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">{prediction.recommended_specialty}</p>
            <RiskBadge level={prediction.risk_level as RiskLevel} />
            {reviewed && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                Reviewed
              </span>
            )}
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
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
