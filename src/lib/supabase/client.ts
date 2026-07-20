import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseBrowserEnv } from "@/lib/supabase/env";

/** Supabase client for use in Client Components (browser). */
export function createClient() {
  const { url, anonKey } = getSupabaseBrowserEnv();
  return createBrowserClient<Database>(url, anonKey);
}
