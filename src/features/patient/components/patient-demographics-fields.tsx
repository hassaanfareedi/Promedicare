"use client";

import type { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import type { PatientOnboardingInput } from "@/schemas/patient";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
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

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export function normaliseBloodGroup(value: string | null): BloodGroup {
  return (BLOOD_GROUPS as readonly string[]).includes(value ?? "")
    ? (value as BloodGroup)
    : "unknown";
}

/** Shared demographics fields for onboarding + patient profile. */
export function PatientDemographicsFields({
  form,
}: {
  form: UseFormReturn<PatientOnboardingInput>;
}) {
  const t = useTranslations("patient");
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fullName")}</FormLabel>
              <FormControl>
                <Input placeholder="Jane Doe" autoComplete="name" {...field} />
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
              <FormLabel>{t("dob")}</FormLabel>
              <FormControl>
                <Input type="date" autoComplete="bday" {...field} />
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
              <FormLabel>{t("gender")}</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                items={[
                  { value: "male", label: t("genderMale") },
                  { value: "female", label: t("genderFemale") },
                  { value: "other", label: t("genderOther") },
                  { value: "prefer_not_to_say", label: t("genderPreferNotToSay") },
                ]}
              >
                <FormControl>
                  <SelectTrigger aria-label={t("gender")}>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">{t("genderMale")}</SelectItem>
                  <SelectItem value="female">{t("genderFemale")}</SelectItem>
                  <SelectItem value="other">{t("genderOther")}</SelectItem>
                  <SelectItem value="prefer_not_to_say">{t("genderPreferNotToSay")}</SelectItem>
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
              <FormLabel>{t("phone")}</FormLabel>
              <FormControl>
                <Input type="tel" autoComplete="tel" placeholder="+92 300 1234567" {...field} />
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
              <FormLabel>{t("bloodGroup")}</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                items={BLOOD_GROUPS.map((bg) => ({
                  value: bg,
                  label: bg === "unknown" ? t("unknown") : bg,
                }))}
              >
                <FormControl>
                  <SelectTrigger aria-label={t("bloodGroup")}>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BLOOD_GROUPS.map((bg) => (
                    <SelectItem key={bg} value={bg}>
                      {bg === "unknown" ? t("unknown") : bg}
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
            <FormLabel>{t("addressOptional")}</FormLabel>
            <FormControl>
              <Textarea rows={2} placeholder="Street, city" autoComplete="street-address" {...field} />
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
              <FormLabel>{t("emergencyContactOptional")}</FormLabel>
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
              <FormLabel>{t("emergencyContactPhoneOptional")}</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="+92 300 1234567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}
