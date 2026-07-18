"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ROLE_HOME, ROLE_PREFIX } from "@/lib/constants";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/schemas/auth";

export type ActionResult = { error: string } | { ok: true; message?: string };

async function siteUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const requestUrl = host ? `${proto}://${host}` : null;
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  // Prefer the live request host when env is missing or still points at localhost
  // while the user is on a real deployment (common Vercel misconfig).
  if (requestUrl && !requestUrl.includes("localhost")) {
    if (!envUrl || envUrl.includes("localhost")) return requestUrl;
  }
  if (envUrl) return envUrl;
  return requestUrl ?? "http://localhost:3000";
}

function googleProviderDisabledMessage(raw: string): string | null {
  const msg = raw.toLowerCase();
  if (
    msg.includes("provider is not enabled") ||
    msg.includes("unsupported provider") ||
    msg.includes("validation_failed")
  ) {
    return "Google sign-in is not configured. Enable the Google provider in Supabase Auth (Authentication → Providers → Google) and set NEXT_PUBLIC_SITE_URL on Vercel.";
  }
  return null;
}

export async function login(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid credentials" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  const user = await getCurrentUser();
  if (!user) redirect("/");
  const requested = (formData.get("redirectTo") as string) || "";
  const allowedPrefix = ROLE_PREFIX[user.profile.role];
  const redirectTo =
    requested.startsWith(allowedPrefix) && !requested.startsWith("//")
      ? requested
      : ROLE_HOME[user.profile.role];
  redirect(redirectTo);
}

export async function register(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${await siteUrl()}/auth/callback`,
    },
  });
  if (error) return { error: error.message };

  // When email confirmation is enabled, no session is returned yet.
  if (data.user && !data.session) {
    return { ok: true, message: "Check your email to confirm your account before signing in." };
  }
  redirect("/onboarding");
}

export async function signInWithGoogle(): Promise<ActionResult> {
  const supabase = await createClient();
  const redirectTo = `${await siteUrl()}/auth/callback`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) {
    return { error: googleProviderDisabledMessage(error.message) ?? error.message };
  }
  if (!data.url) {
    return { error: "Unable to start Google sign-in. Try again in a moment." };
  }

  // Supabase still returns an authorize URL when Google is disabled; probing
  // avoids dumping the user onto a raw JSON error page.
  try {
    const probe = await fetch(data.url, {
      method: "GET",
      redirect: "manual",
      headers: { Accept: "application/json" },
    });
    const contentType = probe.headers.get("content-type") ?? "";
    if (contentType.includes("application/json") || probe.status === 400) {
      const body = (await probe.json().catch(() => null)) as { msg?: string; error_code?: string } | null;
      const raw = body?.msg ?? body?.error_code ?? `HTTP ${probe.status}`;
      return {
        error:
          googleProviderDisabledMessage(raw) ??
          "Google sign-in failed. Check that the Google provider is enabled in Supabase.",
      };
    }
  } catch {
    // Network probe failed — still attempt the redirect; Google/Supabase may work.
  }

  redirect(data.url);
}

export async function forgotPassword(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid email" };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteUrl()}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: error.message };
  return { ok: true, message: "If an account exists for that email, a reset link has been sent." };
}

export async function resetPassword(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid password" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };
  redirect("/login?reset=1");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
