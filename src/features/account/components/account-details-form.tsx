"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateAccountSchema, type UpdateAccountInput } from "@/schemas/account";
import { updateAccount } from "@/features/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

export function AccountDetailsForm({
  fullName,
  phone,
  email,
  /** Patient profile keeps name/phone on the Health form to avoid duplicates. */
  contactFields = "editable",
}: {
  fullName: string | null;
  phone: string | null;
  email: string | null;
  contactFields?: "editable" | "hidden";
}) {
  const router = useRouter();
  const form = useForm<UpdateAccountInput>({
    resolver: zodResolver(updateAccountSchema),
    defaultValues: {
      fullName: fullName ?? "",
      phone: phone ?? "",
    },
  });

  async function onSubmit(values: UpdateAccountInput) {
    const res = await updateAccount(values);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Account updated");
    router.refresh();
  }

  if (contactFields === "hidden") {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="account-email">
          Email
        </label>
        <Input id="account-email" value={email ?? ""} disabled readOnly autoComplete="email" />
        <p className="text-sm text-muted-foreground">
          Email cannot be changed here. Update your name and phone in Health profile below.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="account-email">
            Email
          </label>
          <Input id="account-email" value={email ?? ""} disabled readOnly autoComplete="email" />
          <FormDescription>Email cannot be changed here.</FormDescription>
        </div>
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" autoComplete="name" {...field} />
              </FormControl>
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
                <Input type="tel" autoComplete="tel" placeholder="+92 300 1234567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting} className="justify-self-start">
          {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Save account
        </Button>
      </form>
    </Form>
  );
}
