"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Stethoscope, CheckCircle2, XCircle } from "lucide-react";
import type { AiPrediction } from "@/schemas/prediction";
import { reviewPrediction } from "@/features/doctor/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PredictionResult } from "@/features/patient/components/prediction-result";
import { cn } from "@/lib/utils";

type Props = {
  predictionId: string;
  prediction: AiPrediction;
  patientName: string;
  alreadyReviewed: boolean;
};

export function ReviewDialog({ predictionId, prediction, patientName, alreadyReviewed }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [decision, setDecision] = useState<"reviewed" | "dismissed">("reviewed");
  const [notes, setNotes] = useState("");

  function submit() {
    startTransition(async () => {
      const res = await reviewPrediction({ predictionId, status: decision, reviewNotes: notes || undefined });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Review saved");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant={alreadyReviewed ? "outline" : "default"}>
            <Stethoscope className="size-4" /> {alreadyReviewed ? "View" : "Review"}
          </Button>
        }
      />
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Screening — {patientName}</DialogTitle>
        </DialogHeader>
        <PredictionResult prediction={prediction} />

        {!alreadyReviewed && (
          <div className="space-y-3 border-t pt-4">
            <Label>Decision</Label>
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
                <CheckCircle2 className="size-4" aria-hidden /> Acknowledge
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
                <XCircle className="size-4" aria-hidden /> Dismiss
              </button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-notes">Notes (optional)</Label>
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
                Save review
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
