import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseBrowserEnv } from "@/lib/supabase/env";

/**
 * Supabase client for Server Components, Route Handlers and Server Actions.
 * Reads/writes the auth cookies via the Next.js cookie store.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseBrowserEnv();

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore because
            // middleware refreshes the session cookie on every request.
          }
        },
      },
    },
  );
}
