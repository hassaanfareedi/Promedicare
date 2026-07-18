import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { SymptomCheckForm } from "@/features/patient/components/symptom-check-form";

export const metadata: Metadata = { title: "Symptom check" };

export default function SymptomCheckPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="AI symptom check"
        description="Tell us how you're feeling and get an instant, AI-assisted risk assessment."
      />
      <SymptomCheckForm />
    </div>
  );
}
