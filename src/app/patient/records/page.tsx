import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { getPatientMedicalFile } from "@/features/clinical/data";
import { MedicalFileTable } from "@/features/clinical/components/medical-file-table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Medical records" };

export default async function PatientRecordsPage() {
  await requireRole(["patient"]);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: me } = await supabase
    .from("patients")
    .select("id")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!me) {
    return (
      <div className="space-y-6">
        <PageHeader title="Medical records" description="Your visit history and prescriptions." />
        <EmptyState
          icon={FolderOpen}
          title="No patient profile"
          description="Complete onboarding to view your medical file."
        />
      </div>
    );
  }

  const { patient, visits } = await getPatientMedicalFile(me.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Medical records" description="Your visit history and prescriptions." />

      {!patient || visits.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No records yet"
          description="After a completed visit, notes and prescriptions will show here."
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
