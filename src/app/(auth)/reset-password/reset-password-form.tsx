"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { resetPassword, type ActionResult } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/auth-buttons";

export function ResetPasswordForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(resetPassword, null);
  const error = state && "error" in state ? state.error : null;

  useEffect(() => {
    if (state && "error" in state) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4">
      {error && (
        <p
          role="alert"
          id="reset-error"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <div className="grid gap-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "reset-error" : undefined}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "reset-error" : undefined}
        />
      </div>
      <SubmitButton className="w-full">Update password</SubmitButton>
    </form>
  );
}
