"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { forgotPassword, type ActionResult } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SubmitButton } from "@/components/auth/auth-buttons";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(forgotPassword, null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (state && "error" in state) toast.error(state.error);
    if (state && "ok" in state) setSent(true);
  }, [state]);

  if (sent) {
    return (
      <Alert>
        <MailCheck className="text-emerald-600" />
        <AlertTitle>Check your inbox</AlertTitle>
        <AlertDescription>
          If an account exists for that email, a password reset link is on its way.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </div>
      <SubmitButton className="w-full">Send reset link</SubmitButton>
    </form>
  );
}
