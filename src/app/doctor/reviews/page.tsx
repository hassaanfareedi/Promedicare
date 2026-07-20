import type { Metadata } from "next";
import { Stethoscope } from "lucide-react";
import { getReviewablePredictions } from "@/features/doctor/data";
import { toAiPrediction } from "@/features/patient/prediction-mapper";
import { parseScreeningIntake } from "@/features/patient/intake-parser";
import { clinicalBriefSchema, type ClinicalBrief } from "@/schemas/prediction";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AiDisclaimer } from "@/components/shared/ai-disclaimer";
import { RiskBadge } from "@/components/shared/risk-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/format";
import { ReviewDialog } from "@/features/doctor/components/review-dialog";
import type { PredictionWithPatient } from "@/features/doctor/data";
import type { RiskLevel } from "@/types";

export const metadata: Metadata = { title: "AI reviews" };

function parseBrief(raw: string | null | undefined): ClinicalBrief | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = clinicalBriefSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function ReviewRow({ p }: { p: PredictionWithPatient }) {
  const reviewed = p.status !== "pending_review";
  const intake = parseScreeningIntake(p.input_symptoms, p.input_text);
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium">{p.patient?.full_name ?? "Patient"}</p>
            <RiskBadge level={p.risk_level as RiskLevel} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {p.recommended_specialty_label ?? "Screening"} · {formatDateTime(p.created_at)}
          </p>
          {intake.symptoms.length > 0 && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {intake.symptoms.slice(0, 4).join(", ")}
              {intake.symptoms.length > 4 ? "…" : ""}
            </p>
          )}
        </div>
        <ReviewDialog
          predictionId={p.id}
          prediction={toAiPrediction(p)}
          intake={intake}
          patientName={p.patient?.full_name ?? "Patient"}
          alreadyReviewed={reviewed}
          initialBrief={parseBrief(p.clinical_summary)}
        />
      </CardContent>
    </Card>
  );
}

export default async function DoctorReviewsPage() {
  const all = await getReviewablePredictions(false);
  const pending = all.filter((p) => p.status === "pending_review");

  return (
    <div className="space-y-8">
      <PageHeader title="AI reviews" description="Review AI symptom screenings for your patients." />

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="all">All ({all.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {pending.length === 0 ? (
            <EmptyState icon={Stethoscope} title="All caught up" description="No screenings are waiting for review." />
          ) : (
            pending.map((p) => <ReviewRow key={p.id} p={p} />)
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4 space-y-3">
          {all.length === 0 ? (
            <EmptyState icon={Stethoscope} title="No screenings yet" description="Patient screenings will appear here." />
          ) : (
            all.map((p) => <ReviewRow key={p.id} p={p} />)
          )}
        </TabsContent>
      </Tabs>

      <AiDisclaimer />
    </div>
  );
}
