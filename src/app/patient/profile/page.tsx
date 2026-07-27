import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { IdCard } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getMyPatient } from "@/features/patient/data";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/features/patient/components/profile-form";
import { AccountSettingsSections } from "@/features/account/components/account-settings-sections";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("patient");
  return { title: t("profileTitle") };
}

export default async function ProfilePage() {
  await requireRole(["patient"]);
  const t = await getTranslations("patient");
  const patient = await getMyPatient();
  if (!patient) redirect("/onboarding");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t("profileTitle")} description={t("profileDesc")} />

      <Card className="border-teal-200 bg-teal-50/50 dark:border-teal-900 dark:bg-teal-950/20">
        <CardContent className="flex items-center gap-4 p-5">
          <span className="grid size-11 place-items-center rounded-lg bg-teal-600 text-white">
            <IdCard className="size-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">{t("patientId")}</p>
            <p className="font-mono text-lg font-semibold">{patient.patient_code}</p>
          </div>
        </CardContent>
      </Card>

      <AccountSettingsSections contactFields="hidden" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("healthProfile")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm patient={patient} />
        </CardContent>
      </Card>
    </div>
  );
}
