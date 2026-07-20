import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { AiDisclaimer } from "@/components/shared/ai-disclaimer";
import { SymptomCheckForm } from "@/features/patient/components/symptom-check-form";
import { getMyPatient } from "@/features/patient/data";
import { ageFromDob, sexFromGender } from "@/features/patient/intake-parser";

export const metadata: Metadata = { title: "Symptom check" };

export default async function SymptomCheckPage() {
  const patient = await getMyPatient();
  const prefill = {
    age: ageFromDob(patient?.dob),
    sex: sexFromGender(patient?.gender),
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="AI symptom check"
        description="Select how you feel, then get a quick risk guide and specialist suggestion. This is not a diagnosis."
      />
      <AiDisclaimer compact />
      <SymptomCheckForm prefill={prefill} />
    </div>
  );
}
