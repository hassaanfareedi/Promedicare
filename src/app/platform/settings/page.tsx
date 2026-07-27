import type { Metadata } from "next";
import { CheckCircle2, XCircle, Sparkles, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { isGroqConfigured } from "@/lib/ai/groq-client";
import { APP_NAME } from "@/lib/constants";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { AccountSettingsSections } from "@/features/account/components/account-settings-sections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("platform");
  return { title: t("settingsTitle") };
}

export default async function PlatformSettingsPage() {
  await requireRole(["super_admin"]);
  const aiReady = isGroqConfigured();
  const t = await getTranslations("platform");
  const tPatient = await getTranslations("patient");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t("settingsTitle")} description={t("settingsDesc")} />

      <AccountSettingsSections />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-teal-600" /> {t("aiScreeningTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {aiReady ? t("aiConfigured") : t("aiNotConfigured")}
          </p>
          {aiReady ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <CheckCircle2 className="size-4" /> {t("active")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <XCircle className="size-4" /> {t("notConfigured")}
            </span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-teal-600" /> {t("securityTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{t("securityRls")}</p>
          <p>{t("securityLookup")}</p>
          <p>{t("securityAudit")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("aboutTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>{t("aboutBody", { appName: APP_NAME })}</p>
          <p className="mt-1">{tPatient("decisionSupportOnly")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
