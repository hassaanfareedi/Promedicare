"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { resetPassword, type ActionResult } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/auth-buttons";

export function ResetPasswordForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(resetPassword, null);

  useEffect(() => {
    if (state && "error" in state) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
      </div>
      <SubmitButton className="w-full">Update password</SubmitButton>
    </form>
  );
}
