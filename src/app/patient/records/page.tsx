import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { getPatientMedicalFile } from "@/features/clinical/data";
import { MedicalFileTable } from "@/features/clinical/components/medical-file-table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("patient");
  return { title: t("recordsTitle") };
}

export default async function PatientRecordsPage() {
  await requireRole(["patient"]);
  const t = await getTranslations("patient");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("patients")
    .select("id")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!me) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("recordsTitle")} description={t("recordsDesc")} />
        <EmptyState
          icon={FolderOpen}
          title={t("noProfileTitle")}
          description={t("noProfileDesc")}
        />
      </div>
    );
  }

  const { patient, visits } = await getPatientMedicalFile(me.id);

  return (
    <div className="space-y-6">
      <PageHeader title={t("recordsTitle")} description={t("recordsDesc")} />

      {!patient || visits.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={t("noRecordsTitle")}
          description={t("noRecordsDesc")}
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
