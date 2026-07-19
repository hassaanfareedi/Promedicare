"use client";

import { useActionState, useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { forgotPassword, type ActionResult } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SubmitButton } from "@/components/auth/auth-buttons";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(forgotPassword, null);
  const [sent, setSent] = useState(false);
  const error = state && "error" in state ? state.error : null;

  useEffect(() => {
    if (state && "ok" in state) setSent(true);
  }, [state]);

  if (sent) {
    return (
      <Alert tabIndex={-1} autoFocus>
        <MailCheck className="text-emerald-600" aria-hidden />
        <AlertTitle>Check your inbox</AlertTitle>
        <AlertDescription>
          If an account exists for that email, a password reset link is on its way.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      {error && (
        <p
          role="alert"
          id="forgot-error"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "forgot-error" : undefined}
        />
      </div>
      <SubmitButton className="w-full">Send reset link</SubmitButton>
    </form>
  );
}
