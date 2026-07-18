import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { ROLE_HOME, AI_DISCLAIMER } from "@/lib/constants";
import { Logo } from "@/components/brand/logo";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Complete your profile" };

export default async function OnboardingPage() {
  const user = await requireUser();

  // Only patients pass through onboarding; staff go straight to their portal.
  if (user.profile.role !== "patient") redirect(ROLE_HOME[user.profile.role]);
  if (user.profile.onboarding_completed) redirect("/patient");

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col gap-8 px-4 py-10">
      <Logo />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Complete your health profile</h1>
        <p className="text-sm text-muted-foreground">
          We use these details to personalise your screening and speed up appointment booking.
        </p>
      </div>
      <OnboardingForm defaultName={user.profile.full_name ?? ""} />
      <p className="text-xs text-muted-foreground">{AI_DISCLAIMER}</p>
    </div>
  );
}
