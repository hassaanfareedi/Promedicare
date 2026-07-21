"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { setUserLocale } from "@/i18n/locale";
import { locales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Compact pill for marketing / auth headers. */
  variant?: "pills" | "select";
};

export function LanguageSwitcher({ className, variant = "pills" }: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations("language");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setUserLocale(next);
      router.refresh();
    });
  }

  if (variant === "select") {
    return (
      <label className={cn("grid gap-1.5 text-sm", className)}>
        <span className="font-medium">{t("label")}</span>
        <select
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
          value={locale}
          disabled={pending}
          onChange={(e) => change(e.target.value as Locale)}
          aria-label={t("label")}
        >
          {locales.map((code) => (
            <option key={code} value={code}>
              {t(code)}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">{t("hint")}</span>
      </label>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-border bg-background p-0.5 text-xs font-medium",
        pending && "opacity-70",
        className,
      )}
      role="group"
      aria-label={t("label")}
    >
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          disabled={pending}
          onClick={() => change(code)}
          className={cn(
            "rounded-md px-2.5 py-1.5 transition-colors",
            locale === code
              ? "bg-teal-600 text-white"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={locale === code}
        >
          {t(code)}
        </button>
      ))}
    </div>
  );
}
