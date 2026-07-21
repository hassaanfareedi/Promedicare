import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { AiDisclaimer } from "@/components/shared/ai-disclaimer";
import { SymptomCheckForm } from "@/features/patient/components/symptom-check-form";
import { getMyPatient } from "@/features/patient/data";
import { ageFromDob, sexFromGender } from "@/features/patient/intake-parser";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("patient");
  return { title: t("symptomCheckTitle") };
}

export default async function SymptomCheckPage() {
  const t = await getTranslations("patient");
  const patient = await getMyPatient();
  const prefill = {
    age: ageFromDob(patient?.dob),
    sex: sexFromGender(patient?.gender),
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader title={t("symptomCheckTitle")} description={t("symptomCheckDesc")} />
      <AiDisclaimer compact />
      <SymptomCheckForm prefill={prefill} />
    </div>
  );
}
