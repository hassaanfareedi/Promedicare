import Link from "next/link";
import type { Metadata } from "next";
import { ClipboardList, Activity } from "lucide-react";
import { getMyScreenings } from "@/features/patient/data";
import { toAiPrediction } from "@/features/patient/prediction-mapper";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AiDisclaimer } from "@/components/shared/ai-disclaimer";
import { buttonVariants } from "@/components/ui/button";
import { ScreeningCard } from "@/features/patient/components/screening-card";

export const metadata: Metadata = { title: "Screenings" };

export default async function ScreeningsPage() {
  const screenings = await getMyScreenings();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Your screenings"
        description="A history of your AI symptom checks and their risk assessments."
        actions={
          <Link href="/patient/symptom-check" className={buttonVariants({ size: "sm" })}>
            <Activity className="size-4" /> New check
          </Link>
        }
      />

      {screenings.length === 0 ? (
        <>
          <EmptyState
            icon={ClipboardList}
            title="No screenings yet"
            description="Run your first AI symptom check to get a risk assessment and specialist recommendation."
            action={
              <Link href="/patient/symptom-check" className={buttonVariants({ size: "sm" })}>
                <Activity className="size-4" aria-hidden /> Start symptom check
              </Link>
            }
          />
          <AiDisclaimer />
        </>
      ) : (
        <>
          <div className="space-y-3">
            {screenings.map((p) => (
              <ScreeningCard
                key={p.id}
                prediction={toAiPrediction(p)}
                predictionId={p.id}
                specialtyId={p.recommended_specialty_id}
                createdAt={p.created_at}
                status={p.status}
                reviewNotes={p.review_notes}
              />
            ))}
          </div>
          <AiDisclaimer />
        </>
      )}
    </div>
  );
}
