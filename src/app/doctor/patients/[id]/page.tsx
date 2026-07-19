import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { getPatientMedicalFile } from "@/features/clinical/data";
import { MedicalFileTable } from "@/features/clinical/components/medical-file-table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Medical file" };

export default async function DoctorPatientFilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["doctor"]);
  const { id } = await params;
  const { patient, visits } = await getPatientMedicalFile(id);
  if (!patient) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={patient.full_name}
        description={`Medical file · ${patient.patient_code}`}
        actions={
          <Link href="/doctor/patients" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ArrowLeft className="size-4" /> Patients
          </Link>
        }
      />

      {visits.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No visits on file"
          description="Completed consultations and attachments will appear here."
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
