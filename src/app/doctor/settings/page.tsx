import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { AccountSettingsSections } from "@/features/account/components/account-settings-sections";

export const metadata: Metadata = { title: "Settings" };

export default async function DoctorSettingsPage() {
  await requireRole(["doctor"]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" description="Manage your account and password." />
      <AccountSettingsSections />
    </div>
  );
}
