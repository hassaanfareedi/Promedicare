import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { AuthVisualPanel } from "@/components/auth/auth-visual-panel";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("ai");
  return (
    <div className="grid min-h-svh lg:grid-cols-2 lg:items-stretch">
      <div className="flex flex-col gap-6 p-6 md:p-10">
        <div className="flex items-center justify-between gap-2 md:justify-start md:gap-4">
          <Link href="/">
            <Logo />
          </Link>
          <LanguageSwitcher className="ms-auto md:ms-0" />
        </div>
        <main id="main-content" className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </main>
        <p className="mx-auto max-w-sm text-center text-xs text-muted-foreground">
          {t("disclaimer")}
        </p>
      </div>
      <AuthVisualPanel />
    </div>
  );
}
