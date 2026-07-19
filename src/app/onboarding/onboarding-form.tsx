"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { patientOnboardingSchema, type PatientOnboardingInput } from "@/schemas/patient";
import { completeOnboarding } from "@/features/patient/actions";
import { PatientDemographicsFields } from "@/features/patient/components/patient-demographics-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const form = useForm<PatientOnboardingInput>({
    resolver: zodResolver(patientOnboardingSchema),
    defaultValues: {
      fullName: defaultName,
      dob: "",
      gender: "prefer_not_to_say",
      phone: "",
      bloodGroup: "unknown",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
    },
  });

  async function onSubmit(values: PatientOnboardingInput) {
    const res = await completeOnboarding(values);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Profile saved");
    router.push("/patient");
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
            <PatientDemographicsFields form={form} />
            <Button type="submit" disabled={form.formState.isSubmitting} className="justify-self-start">
              {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
              Save and continue
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
