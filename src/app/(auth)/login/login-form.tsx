"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { login, type ActionResult } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SubmitButton, GoogleButton } from "@/components/auth/auth-buttons";

export function LoginForm() {
  const params = useSearchParams();
  const redirectTo = params.get("redirectTo") ?? "";
  const [state, formAction] = useActionState<ActionResult | null, FormData>(login, null);

  useEffect(() => {
    if (state && "error" in state) toast.error(state.error);
    if (params.get("reset") === "1") toast.success("Password updated. Please sign in.");
  }, [state, params]);

  return (
    <div className="grid gap-6">
      <GoogleButton />
      <div className="relative text-center text-sm">
        <Separator />
        <span className="absolute inset-0 -top-2.5 mx-auto w-fit bg-background px-2 text-muted-foreground">
          or continue with email
        </span>
      </div>
      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <SubmitButton className="w-full">Sign in</SubmitButton>
      </form>
    </div>
  );
}
