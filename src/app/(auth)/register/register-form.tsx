"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { register, type ActionResult } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SubmitButton, GoogleButton } from "@/components/auth/auth-buttons";

export function RegisterForm() {
  const t = useTranslations("auth");
  const [state, formAction] = useActionState<ActionResult | null, FormData>(register, null);
  const [confirmSent, setConfirmSent] = useState(false);
  const error = state && "error" in state ? state.error : null;

  useEffect(() => {
    if (state && "ok" in state && state.message) setConfirmSent(true);
  }, [state]);

  if (confirmSent) {
    return (
      <Alert tabIndex={-1} autoFocus>
        <CheckCircle2 className="text-emerald-600" aria-hidden />
        <AlertTitle>{t("confirmEmailTitle")}</AlertTitle>
        <AlertDescription>{t("confirmEmailBody")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-6">
      <GoogleButton />
      <div className="relative text-center text-sm">
        <Separator />
        <span className="absolute inset-0 -top-2.5 mx-auto w-fit bg-background px-2 text-muted-foreground">
          {t("orSignUpEmail")}
        </span>
      </div>
      <form action={formAction} className="grid gap-4">
        {error && (
          <p
            role="alert"
            id="register-error"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <div className="grid gap-2">
          <Label htmlFor="fullName">{t("fullName")}</Label>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            placeholder="Jane Doe"
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "register-error" : undefined}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "register-error" : undefined}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "register-error" : "password-hint"}
          />
          <p id="password-hint" className="text-xs text-muted-foreground">
            {t("passwordMin")}
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "register-error" : undefined}
          />
        </div>
        <SubmitButton className="w-full">{t("signUp")}</SubmitButton>
      </form>
    </div>
  );
}
