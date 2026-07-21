import { format, formatDistanceToNow, isValid } from "date-fns";
import { enUS } from "date-fns/locale";
import type { Locale as DateFnsLocale } from "date-fns";
import type { Locale } from "@/i18n/config";

/** date-fns has no first-class Urdu locale; use enUS calendar with Urdu UI labels elsewhere. */
const DATE_LOCALES: Record<Locale, DateFnsLocale> = {
  en: enUS,
  ur: enUS,
};

let activeDateLocale: DateFnsLocale = enUS;

/** Call from client/server when locale changes so format helpers stay in sync. */
export function setFormatLocale(locale: Locale) {
  activeDateLocale = DATE_LOCALES[locale] ?? enUS;
}

function loc() {
  return activeDateLocale;
}

/** Formats an ISO timestamp; returns an em dash for empty/invalid input. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return isValid(d) ? format(d, "PPP p", { locale: loc() }) : "—";
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return isValid(d) ? format(d, "PPP", { locale: loc() }) : "—";
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return isValid(d) ? format(d, "p", { locale: loc() }) : "—";
}

export function fromNow(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true, locale: loc() }) : "";
}

/** Formats a doctor display name with a single "Dr." prefix. */
export function formatDoctorName(name: string | null | undefined): string {
  if (!name?.trim()) return "Doctor";
  const cleaned = name.trim().replace(/^(dr\.?\s*)+/i, "");
  return cleaned ? `Dr. ${cleaned}` : "Doctor";
}
