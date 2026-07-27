"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { walkInPatientSchema, type WalkInPatientInput } from "@/schemas/patient";
import { registerWalkIn } from "@/features/reception/actions";
import { formatDoctorName } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

export type WalkInDoctorOption = {
  id: string;
  full_name: string | null;
  specialty_name: string | null;
};

function defaultVisitTimeLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 5 - (d.getMinutes() % 5), 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function WalkInDialog({ doctors }: { doctors: WalkInDoctorOption[] }) {
  const router = useRouter();
  const t = useTranslations("reception");
  const tAppt = useTranslations("appointments");
  const [open, setOpen] = useState(false);
  const doctorItems = useMemo(
    () =>
      doctors.map((d) => ({
        value: d.id,
        label: `${formatDoctorName(d.full_name)}${d.specialty_name ? ` · ${d.specialty_name}` : ""}`,
      })),
    [doctors],
  );

  const form = useForm<WalkInPatientInput>({
    resolver: zodResolver(walkInPatientSchema),
    defaultValues: {
      fullName: "",
      dob: "",
      gender: "prefer_not_to_say",
      phone: "",
      email: "",
      address: "",
      doctorId: doctors[0]?.id ?? "",
      scheduledStart: defaultVisitTimeLocal(),
      reason: "",
    },
  });

  async function onSubmit(values: WalkInPatientInput) {
    const payload = {
      ...values,
      scheduledStart: new Date(values.scheduledStart).toISOString(),
    };
    const res = await registerWalkIn(payload);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(t("walkInBooked", { code: res.data.patientCode }));
    form.reset({
      fullName: "",
      dob: "",
      gender: "prefer_not_to_say",
      phone: "",
      email: "",
      address: "",
      doctorId: doctors[0]?.id ?? "",
      scheduledStart: defaultVisitTimeLocal(),
      reason: "",
    });
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <UserPlus className="size-4" aria-hidden /> {t("registerWalkIn")}
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("registerWalkInTitle")}</DialogTitle>
          <DialogDescription>
            {t("registerWalkInDesc")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fullName")}</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("dob")}</FormLabel>
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
                    <FormLabel>{t("gender")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      items={[
                        { value: "male", label: t("male") },
                        { value: "female", label: t("female") },
                        { value: "other", label: t("other") },
                        { value: "prefer_not_to_say", label: t("preferNotToSay") },
                      ]}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">{t("male")}</SelectItem>
                        <SelectItem value="female">{t("female")}</SelectItem>
                        <SelectItem value="other">{t("other")}</SelectItem>
                        <SelectItem value="prefer_not_to_say">{t("preferNotToSay")}</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Input type="tel" autoComplete="tel" placeholder="+92 300 1234567" {...field} />
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
                    <FormLabel>{t("emailOptional")}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane@example.com" {...field} />
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
                  <FormLabel>{t("addressOptional")}</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Street, city" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="doctorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAppt("doctor")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    items={doctorItems}
                  >
                    <FormControl>
                      <SelectTrigger aria-label={tAppt("doctor")}>
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {doctors.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {formatDoctorName(d.full_name)}
                          {d.specialty_name ? ` · ${d.specialty_name}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="scheduledStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("visitTime")}</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reasonOptional")}</FormLabel>
                  <FormControl>
                    <Input placeholder="Walk-in complaint" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || doctors.length === 0}
              className="justify-self-end"
            >
              {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
              {t("registerAndBook")}
            </Button>
            {doctors.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("noDoctorsWalkIn")}</p>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
