import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/constants";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { OnboardingForm } from "./onboarding-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("onboarding");
  return { title: t("title") };
}

export default async function OnboardingPage() {
  const user = await requireUser();
  const t = await getTranslations("onboarding");
  const tAi = await getTranslations("ai");

  if (user.profile.role !== "patient") redirect(ROLE_HOME[user.profile.role]);
  if (user.profile.onboarding_completed) redirect("/patient");

  return (
    <main id="main-content" className="mx-auto flex min-h-svh max-w-2xl flex-col gap-8 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <Logo />
        <LanguageSwitcher />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <OnboardingForm defaultName={user.profile.full_name ?? ""} />
      <p className="text-xs text-muted-foreground">{tAi("disclaimer")}</p>
    </main>
  );
}
