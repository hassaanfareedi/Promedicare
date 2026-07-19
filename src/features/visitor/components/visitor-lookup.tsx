"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2, Search, ShieldCheck, CalendarClock, History, ArrowLeft } from "lucide-react";
import { visitorLookupSchema, type VisitorLookupInput } from "@/schemas/visitor";
import { lookupRecord } from "@/features/visitor/actions";
import type { VisitorRecord } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDoctorName } from "@/lib/format";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

function safeDate(value: string | null | undefined, withTime = false): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, withTime ? "PPP p" : "PPP");
}

export function VisitorLookup() {
  const [record, setRecord] = useState<VisitorRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [factor, setFactor] = useState<"dob" | "phone">("dob");

  const form = useForm<VisitorLookupInput>({
    resolver: zodResolver(visitorLookupSchema),
    defaultValues: { patientCode: "", dob: "", phone: "" },
  });

  async function onSubmit(values: VisitorLookupInput) {
    setError(null);
    const payload: VisitorLookupInput =
      factor === "dob"
        ? { ...values, phone: "" }
        : { ...values, dob: "" };
    const res = await lookupRecord(payload);
    if (!res.ok) {
      setError(res.error);
      setRecord(null);
      return;
    }
    setRecord(res.record);
  }

  if (record) {
    return (
      <Card className="border-teal-200 dark:border-teal-900">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
            <ShieldCheck className="size-5" /> Record found
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRecord(null);
              form.reset();
            }}
          >
            <ArrowLeft className="size-4" /> New search
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-1">
            <p className="text-xl font-semibold">{record.fullName}</p>
            <p className="text-sm text-muted-foreground">
              Patient ID <span className="font-mono">{record.patientCode}</span>
              {record.registeredHospital ? ` · ${record.registeredHospital}` : ""}
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium">
              <CalendarClock className="size-4 text-teal-600" /> Next appointment
            </p>
            {record.nextAppointment ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span>{safeDate(record.nextAppointment.date, true)}</span>
                <StatusBadge status={record.nextAppointment.status} />
                {record.nextAppointment.doctor && (
                  <span className="text-muted-foreground">
                    {formatDoctorName(record.nextAppointment.doctor)}
                  </span>
                )}
                {record.nextAppointment.department && (
                  <span className="text-muted-foreground">{record.nextAppointment.department}</span>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming appointment.</p>
            )}
          </div>

          <div className="rounded-lg border p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium">
              <History className="size-4 text-teal-600" /> Recent history
            </p>
            {record.recentHistory.length > 0 ? (
              <ul className="divide-y">
                {record.recentHistory.map((h, i) => (
                  <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span>{safeDate(h.date, true)}</span>
                    <span className="flex items-center gap-3">
                      {h.doctor && (
                        <span className="text-muted-foreground">{formatDoctorName(h.doctor)}</span>
                      )}
                      <StatusBadge status={h.status} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No visit history on record.</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            This public view shows limited information only. Sign in to your patient account for full
            records, screenings and booking.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="size-5 text-teal-600" /> Look up your record
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="patientCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient ID</FormLabel>
                  <FormControl>
                    <Input placeholder="PMC-123456" autoComplete="off" {...field} />
                  </FormControl>
                  <FormDescription>Find this on your appointment slip or confirmation.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Tabs value={factor} onValueChange={(v) => setFactor(v as "dob" | "phone")}>
              <FormLabel className="mb-1 block">Verify it&apos;s you</FormLabel>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dob">Date of birth</TabsTrigger>
                <TabsTrigger value="phone">Registered phone</TabsTrigger>
              </TabsList>
              <TabsContent value="dob" className="mt-3">
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="phone" className="mt-3">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="tel" placeholder="+92 300 1234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Search className="size-4" />}
              Find my record
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              For your privacy, we require your Patient ID plus one verification detail.
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
