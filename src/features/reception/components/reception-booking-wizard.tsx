"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Loader2,
  Stethoscope,
  Clock,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Search,
  UserRound,
} from "lucide-react";
import { getDoctorSlots } from "@/features/appointments/actions";
import { bookReceptionAppointment } from "@/features/reception/actions";
import type { SlotGroup } from "@/features/appointments/slots";
import type { WalkInDoctor } from "@/features/reception/data";
import type { ReceptionBookingInput } from "@/schemas/appointment";
import type { Patient } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Stepper } from "@/components/ui/stepper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDateTime, formatDoctorName } from "@/lib/format";

type Gender = "male" | "female" | "other" | "prefer_not_to_say";

type NewPatient = {
  fullName: string;
  dob: string;
  gender: Gender;
  phone: string;
  email: string;
  address: string;
};

const EMPTY_NEW_PATIENT: NewPatient = {
  fullName: "",
  dob: "",
  gender: "prefer_not_to_say",
  phone: "",
  email: "",
  address: "",
};

type Props = {
  patients: Patient[];
  doctors: WalkInDoctor[];
  initialPatientId?: string;
};

export function ReceptionBookingWizard({ patients, doctors, initialPatientId }: Props) {
  const router = useRouter();
  const t = useTranslations("reception");
  const tAppt = useTranslations("appointments");
  const tPatient = useTranslations("patient");
  const tRoles = useTranslations("roles");
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);

  const STEPS = [
    { id: "patient", label: tRoles("patient") },
    { id: "doctor", label: tAppt("doctor") },
    { id: "time", label: tAppt("time") },
    { id: "confirm", label: tAppt("confirm") },
  ];

  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing");
  const [existingPatientId, setExistingPatientId] = useState<string | null>(
    initialPatientId ?? null,
  );
  const [search, setSearch] = useState("");
  const [newPatient, setNewPatient] = useState<NewPatient>(EMPTY_NEW_PATIENT);

  const [doctor, setDoctor] = useState<WalkInDoctor | null>(null);
  const [slots, setSlots] = useState<SlotGroup[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slot, setSlot] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => {
      return (
        p.full_name.toLowerCase().includes(q) ||
        (p.patient_code?.toLowerCase().includes(q) ?? false) ||
        (p.phone?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [patients, search]);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === existingPatientId) ?? null,
    [patients, existingPatientId],
  );

  const patientValid =
    patientMode === "existing"
      ? Boolean(existingPatientId)
      : newPatient.fullName.trim().length >= 2 &&
        newPatient.dob.trim().length > 0 &&
        newPatient.phone.trim().length >= 7;

  const patientLabel =
    patientMode === "existing"
      ? (selectedPatient?.full_name ?? "—")
      : newPatient.fullName.trim() || t("newPatient");

  async function selectDoctor(d: WalkInDoctor) {
    setDoctor(d);
    setSlot(null);
    setStep(2);
    setLoadingSlots(true);
    try {
      const groups = await getDoctorSlots(d.id);
      setSlots(groups);
    } finally {
      setLoadingSlots(false);
    }
  }

  function buildPayload(): ReceptionBookingInput | null {
    if (!doctor || !slot) return null;
    const base = { doctorId: doctor.id, scheduledStart: slot, reason: reason || "" };
    if (patientMode === "existing") {
      if (!existingPatientId) return null;
      return { ...base, patient: { mode: "existing", patientId: existingPatientId } };
    }
    return {
      ...base,
      patient: {
        mode: "new",
        fullName: newPatient.fullName.trim(),
        dob: newPatient.dob,
        gender: newPatient.gender,
        phone: newPatient.phone.trim(),
        email: newPatient.email.trim(),
        address: newPatient.address.trim(),
      },
    };
  }

  function confirm() {
    const payload = buildPayload();
    if (!payload) return;
    startTransition(async () => {
      const res = await bookReceptionAppointment(payload);
      if (!res.ok) {
        toast.error(res.error);
        // A taken slot means our candidate list is stale — refresh it.
        if (doctor) {
          setLoadingSlots(true);
          try {
            const groups = await getDoctorSlots(doctor.id);
            setSlots(groups);
            setStep(2);
            setSlot(null);
          } catch {
            toast.error(t("refreshTimesFailed"));
          } finally {
            setLoadingSlots(false);
          }
        }
        return;
      }
      toast.success(tAppt("booked"));
      router.push("/reception/appointments");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Stepper steps={STEPS} current={step} />

      {step === 0 && (
        <div className="space-y-4">
          <Tabs
            value={patientMode}
            onValueChange={(v) => setPatientMode(v as "existing" | "new")}
          >
            <TabsList className="w-full">
              <TabsTrigger value="existing">{t("existingPatient")}</TabsTrigger>
              <TabsTrigger value="new">{t("newPatient")}</TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-3 pt-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, patient ID, or phone"
                  className="pl-9"
                  aria-label={t("searchPatients")}
                />
              </div>
              <div className="grid max-h-80 gap-2 overflow-y-auto">
                {filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setExistingPatientId(p.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:border-teal-500 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      existingPatientId === p.id &&
                        "border-teal-600 bg-teal-50 dark:bg-teal-950/30",
                    )}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-950/50">
                      <UserRound className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{p.full_name}</span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {p.patient_code ?? "—"}
                        {p.phone ? ` · ${p.phone}` : ""}
                      </span>
                    </span>
                  </button>
                ))}
                {filteredPatients.length === 0 && (
                  <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    {t("noPatientsMatch")}
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="new" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="new-full-name">{t("fullName")}</Label>
                <Input
                  id="new-full-name"
                  value={newPatient.fullName}
                  onChange={(e) =>
                    setNewPatient((s) => ({ ...s, fullName: e.target.value }))
                  }
                  placeholder="Jane Doe"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-dob">{t("dob")}</Label>
                  <Input
                    id="new-dob"
                    type="date"
                    value={newPatient.dob}
                    onChange={(e) => setNewPatient((s) => ({ ...s, dob: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("gender")}</Label>
                  <Select
                    value={newPatient.gender}
                    onValueChange={(v) =>
                      setNewPatient((s) => ({ ...s, gender: v as Gender }))
                    }
                    items={[
                      { value: "male", label: t("male") },
                      { value: "female", label: t("female") },
                      { value: "other", label: t("other") },
                      { value: "prefer_not_to_say", label: t("preferNotToSay") },
                    ]}
                  >
                    <SelectTrigger aria-label={t("gender")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{t("male")}</SelectItem>
                      <SelectItem value="female">{t("female")}</SelectItem>
                      <SelectItem value="other">{t("other")}</SelectItem>
                      <SelectItem value="prefer_not_to_say">{t("preferNotToSay")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-phone">{t("phone")}</Label>
                  <Input
                    id="new-phone"
                    type="tel"
                    autoComplete="tel"
                    value={newPatient.phone}
                    onChange={(e) =>
                      setNewPatient((s) => ({ ...s, phone: e.target.value }))
                    }
                    placeholder="+92 300 1234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-email">{t("emailOptional")}</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newPatient.email}
                    onChange={(e) =>
                      setNewPatient((s) => ({ ...s, email: e.target.value }))
                    }
                    placeholder="jane@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-address">{t("addressOptional")}</Label>
                <Textarea
                  id="new-address"
                  rows={2}
                  value={newPatient.address}
                  onChange={(e) =>
                    setNewPatient((s) => ({ ...s, address: e.target.value }))
                  }
                  placeholder="Street, city"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button disabled={!patientValid} onClick={() => setStep(1)}>
              {t("continue")} <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
            <ArrowLeft className="size-4" /> {t("changePatient")}
          </Button>
          <div className="grid gap-3">
            {doctors.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => selectDoctor(d)}
                className="flex items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:border-teal-500 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-950/50">
                  <Stethoscope className="size-5" />
                </span>
                <div>
                  <p className="font-medium">{formatDoctorName(d.full_name)}</p>
                  <p className="text-sm text-muted-foreground">
                    {d.specialty_name ?? t("general")}
                  </p>
                </div>
              </button>
            ))}
            {doctors.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t("noDoctors")}
              </p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
            <ArrowLeft className="size-4" /> {tPatient("changeDoctor")}
          </Button>
          {loadingSlots ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" /> {t("loadingTimes")}
            </div>
          ) : slots.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              {tPatient("noSlots", { doctor: formatDoctorName(doctor?.full_name) })}
            </p>
          ) : (
            <div className="space-y-4">
              {slots.map((group) => (
                <div key={group.date}>
                  <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Clock className="size-4 text-teal-600" /> {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.slots.map((s) => (
                      <button
                        key={s.iso}
                        type="button"
                        onClick={() => {
                          setSlot(s.iso);
                          setStep(3);
                        }}
                        className={cn(
                          "min-h-10 min-w-10 rounded-lg border px-3 py-2 text-sm transition-colors hover:border-teal-500 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          slot === s.iso && "border-teal-600 bg-teal-600 text-white",
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 3 && doctor && slot && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="-ml-2">
              <ArrowLeft className="size-4" /> {t("changeTime")}
            </Button>
            <div className="grid gap-3 rounded-lg bg-muted/50 p-4 text-sm">
              <Row
                label={tRoles("patient")}
                value={
                  patientMode === "new" ? t("patientNew", { name: patientLabel }) : patientLabel
                }
              />
              <Row label={tAppt("doctor")} value={formatDoctorName(doctor.full_name)} />
              <Row label={t("specialty")} value={doctor.specialty_name ?? t("general")} />
              <Row label={t("when")} value={formatDateTime(slot)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">{t("reasonForVisitOptional")}</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Briefly describe the reason for the appointment"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={confirm} disabled={pending}>
                {pending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                {tPatient("confirmBooking")} <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
