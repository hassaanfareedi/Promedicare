"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { setFormatLocale } from "@/lib/format";
import type { Locale } from "@/i18n/config";

/** Keeps date-fns helpers aligned with the active UI locale. */
export function FormatLocaleSync() {
  const locale = useLocale() as Locale;
  useEffect(() => {
    setFormatLocale(locale);
  }, [locale]);
  return null;
}
