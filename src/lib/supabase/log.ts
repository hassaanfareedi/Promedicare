import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Logs a Supabase read error server-side so silent RLS/query failures surface in
 * logs instead of masquerading as empty UI. Read fetchers still fall back to a
 * safe empty value; this just makes the failure observable.
 */
export function logDbError(
  scope: string,
  error: PostgrestError | null,
  context?: Record<string, unknown>,
): void {
  if (error) {
    console.error(`[${scope}]`, error.message, context ?? {});
  }
}
