import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RegisterForm } from "./register-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("registerTitle") };
}

export default async function RegisterPage() {
  const t = await getTranslations("auth");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("createYourAccount")}</h1>
        <p className="text-sm text-muted-foreground">{t("startScreening")}</p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}
