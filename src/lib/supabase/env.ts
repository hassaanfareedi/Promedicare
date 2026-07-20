/**
 * Reads and validates the public Supabase environment variables. Throwing a
 * clear message at call time beats the opaque runtime failures produced by
 * non-null assertions (`process.env.X!`) when a variable is missing.
 */
export function getSupabaseBrowserEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example).",
    );
  }
  return { url, anonKey };
}
