import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { AiDisclaimer } from "@/components/shared/ai-disclaimer";
import { SymptomCheckForm } from "@/features/patient/components/symptom-check-form";

export const metadata: Metadata = { title: "Symptom check" };

export default function SymptomCheckPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="AI symptom check"
        description="Select how you feel, then get a quick risk guide and specialist suggestion. This is not a diagnosis."
      />
      <AiDisclaimer compact />
      <p className="text-sm text-foreground/70">
        <span className="font-medium text-foreground">Step 1:</span> tap the symptoms that match, then
        add any extras below.
      </p>
      <SymptomCheckForm />
    </div>
  );
}
