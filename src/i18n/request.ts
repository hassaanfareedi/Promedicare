import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

async function loadMessages(locale: Locale) {
  try {
    return (await import(`../../messages/${locale}.json`)).default;
  } catch {
    return (await import(`../../messages/${defaultLocale}.json`)).default;
  }
}

/**
 * Resolve the active locale. The cookie is the fast path (and the source of
 * truth for guests). When it is missing/invalid, fall back to the signed-in
 * user's stored `profiles.preferred_locale` so a cleared cookie still honours
 * their saved preference.
 */
async function resolveLocale(): Promise<Locale> {
  const store = await cookies();
  const raw = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(raw)) return raw;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("preferred_locale")
        .eq("id", user.id)
        .maybeSingle();
      if (isLocale(data?.preferred_locale)) return data.preferred_locale;
    }
  } catch {
    // Fall through to default (e.g. column not migrated yet / no session).
  }

  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  return {
    locale,
    messages: await loadMessages(locale),
  };
});
