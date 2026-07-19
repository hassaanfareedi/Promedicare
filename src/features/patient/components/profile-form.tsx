"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { patientOnboardingSchema, type PatientOnboardingInput } from "@/schemas/patient";
import { completeOnboarding } from "@/features/patient/actions";
import {
  PatientDemographicsFields,
  normaliseBloodGroup,
} from "@/features/patient/components/patient-demographics-fields";
import type { Patient, Gender } from "@/types";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

export function ProfileForm({ patient }: { patient: Patient }) {
  const router = useRouter();
  const form = useForm<PatientOnboardingInput>({
    resolver: zodResolver(patientOnboardingSchema),
    defaultValues: {
      fullName: patient.full_name ?? "",
      dob: patient.dob ?? "",
      gender: (patient.gender as Gender | null) ?? "prefer_not_to_say",
      phone: patient.phone ?? "",
      bloodGroup: normaliseBloodGroup(patient.blood_group),
      address: patient.address ?? "",
      emergencyContactName: patient.emergency_contact_name ?? "",
      emergencyContactPhone: patient.emergency_contact_phone ?? "",
    },
  });

  async function onSubmit(values: PatientOnboardingInput) {
    const res = await completeOnboarding(values);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Profile updated");
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
        <PatientDemographicsFields form={form} />
        <Button type="submit" disabled={form.formState.isSubmitting} className="justify-self-start">
          {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          Save changes
        </Button>
      </form>
    </Form>
  );
}
