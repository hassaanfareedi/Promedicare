import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isGroqConfigured, verifyGroq } from "@/lib/ai/groq-client";

/**
 * Diagnostic endpoint to verify the Groq integration once GROQ_API_KEY is set.
 * Authenticated-only to avoid anonymous token consumption.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isGroqConfigured()) {
    return NextResponse.json({ configured: false, message: "GROQ_API_KEY is not set." });
  }

  const result = await verifyGroq();
  if (result.ok) {
    return NextResponse.json({ configured: true, ok: true, model: result.model });
  }
  return NextResponse.json({ configured: true, ok: false, error: result.error }, { status: 502 });
}
