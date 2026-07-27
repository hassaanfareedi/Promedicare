import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { getPatientMedicalFile } from "@/features/clinical/data";
import { MedicalFileTable } from "@/features/clinical/components/medical-file-table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/shared/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("doctor");
  return { title: t("medicalFileTitle") };
}

export default async function DoctorPatientFilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["doctor"]);
  const { id } = await params;
  const { patient, visits } = await getPatientMedicalFile(id);
  if (!patient) notFound();
  const t = await getTranslations("doctor");

  return (
    <div className="space-y-6">
      <PageHeader
        title={patient.full_name}
        description={t("medicalFileDesc", { code: patient.patient_code })}
        actions={
          <LinkButton href="/doctor/patients" variant="outline" size="sm">
            <ArrowLeft className="size-4" /> {t("backToPatients")}
          </LinkButton>
        }
      />

      {visits.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={t("noVisitsTitle")}
          description={t("noVisitsDesc")}
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <MedicalFileTable
              visits={visits}
              patientName={patient.full_name}
              patientCode={patient.patient_code}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
