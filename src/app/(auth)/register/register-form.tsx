"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { register, type ActionResult } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SubmitButton, GoogleButton } from "@/components/auth/auth-buttons";

export function RegisterForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(register, null);
  const [confirmSent, setConfirmSent] = useState(false);

  useEffect(() => {
    if (state && "error" in state) toast.error(state.error);
    if (state && "ok" in state && state.message) setConfirmSent(true);
  }, [state]);

  if (confirmSent) {
    return (
      <Alert>
        <CheckCircle2 className="text-emerald-600" />
        <AlertTitle>Confirm your email</AlertTitle>
        <AlertDescription>
          We&apos;ve sent a confirmation link to your inbox. Click it to activate your account, then
          sign in.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-6">
      <GoogleButton />
      <div className="relative text-center text-sm">
        <Separator />
        <span className="absolute inset-0 -top-2.5 mx-auto w-fit bg-background px-2 text-muted-foreground">
          or sign up with email
        </span>
      </div>
      <form action={formAction} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" autoComplete="name" placeholder="Jane Doe" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
          <p className="text-xs text-muted-foreground">
            At least 8 characters with upper, lower and a number.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
        </div>
        <SubmitButton className="w-full">Create account</SubmitButton>
      </form>
    </div>
  );
}
