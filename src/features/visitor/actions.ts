"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { visitorLookupSchema, visitorRecordSchema, type VisitorLookupInput } from "@/schemas/visitor";
import type { VisitorRecord } from "@/types";

export type LookupResult =
  | { ok: true; record: VisitorRecord }
  | { ok: false; error: string };

const GENERIC_ERROR =
  "We couldn't find a matching record. Please check the Patient ID and verification detail and try again.";

export async function lookupRecord(input: VisitorLookupInput): Promise<LookupResult> {
  const parsed = visitorLookupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  // Rate limit per client IP to prevent Patient ID enumeration.
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? "unknown").trim();
  const limited = rateLimit(`visitor:${ip}`, { limit: 8, windowMs: 10 * 60_000 });
  if (!limited.allowed) {
    return {
      ok: false,
      error: `Too many attempts. Please try again in ${Math.ceil(limited.retryAfterMs / 60_000)} minute(s).`,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("visitor_lookup", {
    p_code: parsed.data.patientCode,
    p_dob: parsed.data.dob || undefined,
    p_phone: parsed.data.phone || undefined,
  });

  if (error || !data) {
    return { ok: false, error: GENERIC_ERROR };
  }

  // The RPC returns untyped JSON; validate it before trusting the shape.
  const record = visitorRecordSchema.safeParse(data);
  if (!record.success) {
    return { ok: false, error: GENERIC_ERROR };
  }
  return { ok: true, record: record.data satisfies VisitorRecord };
}
