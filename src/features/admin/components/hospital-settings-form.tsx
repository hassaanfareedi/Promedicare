"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateHospitalSchema, type UpdateHospitalInput } from "@/schemas/platform";
import { updateMyHospital } from "@/features/admin/actions";
import type { Hospital } from "@/types";
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

export function HospitalSettingsForm({ hospital }: { hospital: Hospital }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const form = useForm<UpdateHospitalInput>({
    resolver: zodResolver(updateHospitalSchema),
    defaultValues: {
      name: hospital.name ?? "",
      city: hospital.city ?? "",
      timezone: hospital.timezone ?? "Asia/Karachi",
      phone: hospital.phone ?? "",
      address: hospital.address ?? "",
      email: hospital.email ?? "",
    },
  });

  async function onSubmit(values: UpdateHospitalInput) {
    const res = await updateMyHospital(values);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(t("hospitalDetailsUpdated"));
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("hospitalName")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("city")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("timezone")}</FormLabel>
                <FormControl>
                  <Input placeholder="Asia/Karachi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("phone")}</FormLabel>
                <FormControl>
                  <Input type="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("email")}</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
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
              <FormLabel>{t("address")}</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting} className="justify-self-start">
          {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {t("saveHospital")}
        </Button>
      </form>
    </Form>
  );
}
