import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getMyHospital } from "@/features/admin/data";
import { PageHeader } from "@/components/shared/page-header";
import { AccountSettingsSections } from "@/features/account/components/account-settings-sections";
import { HospitalSettingsForm } from "@/features/admin/components/hospital-settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  await requireRole(["hospital_admin"]);
  const hospital = await getMyHospital();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account, password, and hospital details."
      />

      <AccountSettingsSections />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-teal-600" /> Hospital details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hospital ? (
            <HospitalSettingsForm hospital={hospital} />
          ) : (
            <EmptyState
              icon={Building2}
              title="No hospital linked"
              description="Your admin account is not linked to a hospital."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
