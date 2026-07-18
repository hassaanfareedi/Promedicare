"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { patientOnboardingSchema, type PatientOnboardingInput } from "@/schemas/patient";
import { completeOnboarding } from "@/features/patient/actions";
import type { Patient, Gender } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"] as const;
type BloodGroup = (typeof BLOOD_GROUPS)[number];

function normaliseBloodGroup(value: string | null): BloodGroup {
  return (BLOOD_GROUPS as readonly string[]).includes(value ?? "") ? (value as BloodGroup) : "unknown";
}

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
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  items={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "other", label: "Other" },
                    { value: "prefer_not_to_say", label: "Prefer not to say" },
                  ]}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+92 300 1234567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bloodGroup"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Blood group</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  items={BLOOD_GROUPS.map((bg) => ({
                    value: bg,
                    label: bg === "unknown" ? "Unknown" : bg,
                  }))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BLOOD_GROUPS.map((bg) => (
                      <SelectItem key={bg} value={bg}>
                        {bg === "unknown" ? "Unknown" : bg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (optional)</FormLabel>
              <FormControl>
                <Textarea rows={2} placeholder="Street, city" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="emergencyContactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency contact (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Contact name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emergencyContactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency contact phone (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="+92 300 1234567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={form.formState.isSubmitting} className="justify-self-start">
          {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          Save changes
        </Button>
      </form>
    </Form>
  );
}
