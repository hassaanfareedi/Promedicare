"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Building2, Stethoscope, Clock, CheckCircle2, ArrowLeft, ArrowRight, Star } from "lucide-react";
import { bookAppointment, getDoctorSlots } from "@/features/appointments/actions";
import type { SlotGroup } from "@/features/appointments/slots";
import type { BookingHospital } from "@/features/appointments/data";
import type { DoctorDirectory } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Stepper } from "@/components/ui/stepper";
import { cn } from "@/lib/utils";
import { formatDateTime, formatDoctorName } from "@/lib/format";

type Props = {
  hospitals: BookingHospital[];
  doctors: DoctorDirectory[];
  recommendedSpecialtyId?: string;
  predictionId?: string;
};

export function BookingWizard({ hospitals, doctors, recommendedSpecialtyId, predictionId }: Props) {
  const router = useRouter();
  const tAppt = useTranslations("appointments");
  const tPatient = useTranslations("patient");
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);

  const STEPS = [
    { id: "hospital", label: tAppt("hospital") },
    { id: "doctor", label: tAppt("doctor") },
    { id: "time", label: tAppt("time") },
    { id: "confirm", label: tAppt("confirm") },
  ];

  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [doctor, setDoctor] = useState<DoctorDirectory | null>(null);
  const [slots, setSlots] = useState<SlotGroup[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slot, setSlot] = useState<string | null>(null);
  const [slotTaken, setSlotTaken] = useState(false);
  const [reason, setReason] = useState("");
  const slotRequestId = useRef(0);

  const recommendedSpecialtyName = useMemo(() => {
    if (!recommendedSpecialtyId) return null;
    return (
      doctors.find((d) => d.specialty_id === recommendedSpecialtyId)?.specialty_name ?? null
    );
  }, [doctors, recommendedSpecialtyId]);

  const sortedHospitals = useMemo(() => {
    if (!recommendedSpecialtyId) return hospitals;
    return [...hospitals].sort((a, b) => {
      const aHas = doctors.some(
        (d) => d.hospital_id === a.id && d.specialty_id === recommendedSpecialtyId,
      )
        ? 0
        : 1;
      const bHas = doctors.some(
        (d) => d.hospital_id === b.id && d.specialty_id === recommendedSpecialtyId,
      )
        ? 0
        : 1;
      return aHas - bHas;
    });
  }, [hospitals, doctors, recommendedSpecialtyId]);

  const hospitalDoctors = useMemo(() => {
    const list = doctors.filter((d) => d.hospital_id === hospitalId);
    if (!recommendedSpecialtyId) return list;
    return [...list].sort((a, b) => {
      const aMatch = a.specialty_id === recommendedSpecialtyId ? 0 : 1;
      const bMatch = b.specialty_id === recommendedSpecialtyId ? 0 : 1;
      return aMatch - bMatch;
    });
  }, [doctors, hospitalId, recommendedSpecialtyId]);

  const hasRecommendedAtHospital =
    Boolean(recommendedSpecialtyId) &&
    hospitalDoctors.some((d) => d.specialty_id === recommendedSpecialtyId);

  async function selectDoctor(d: DoctorDirectory) {
    setDoctor(d);
    setSlot(null);
    setStep(2);
    if (!d.id) return;
    const reqId = ++slotRequestId.current;
    setLoadingSlots(true);
    setSlots([]);
    try {
      const groups = await getDoctorSlots(d.id);
      if (reqId !== slotRequestId.current) return; // a newer request superseded this one
      setSlots(groups);
    } catch {
      if (reqId === slotRequestId.current) {
        toast.error(tAppt("loadTimesError"));
      }
    } finally {
      if (reqId === slotRequestId.current) setLoadingSlots(false);
    }
  }

  function confirm() {
    if (!hospitalId || !doctor?.id || !slot) return;
    setSlotTaken(false);
    startTransition(async () => {
      const res = await bookAppointment({
        hospitalId,
        doctorId: doctor.id!,
        departmentId: doctor.department_id ?? undefined,
        scheduledStart: slot,
        reason: reason || undefined,
        predictionId: predictionId ?? undefined,
      });
      if (!res.ok) {
        const slotConflict = /taken|unavailable|slot/i.test(res.error);
        if (slotConflict) {
          // Our candidate list is stale. Keep the user on Confirm with an inline
          // notice and quietly refresh candidates so "Change time" is fresh.
          setSlotTaken(true);
          if (doctor.id) {
            try {
              const groups = await getDoctorSlots(doctor.id);
              setSlots(groups);
            } catch {
              /* keep the current candidates if the refresh fails */
            }
          }
        } else {
          // Surface the real reason (auth, validation, network) instead of
          // implying the slot was taken.
          toast.error(res.error);
        }
        return;
      }
      toast.success(tAppt("booked"));
      router.push("/patient/appointments");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Stepper steps={STEPS} current={step} />

      {recommendedSpecialtyId && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100">
          {tPatient("fromSymptomCheck", {
            specialty: recommendedSpecialtyName ?? tPatient("matchingSpecialty"),
          })}
        </div>
      )}

      {step === 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {sortedHospitals.map((h) => {
            const hasRecommended =
              Boolean(recommendedSpecialtyId) &&
              doctors.some(
                (d) => d.hospital_id === h.id && d.specialty_id === recommendedSpecialtyId,
              );
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  setHospitalId(h.id);
                  setDoctor(null);
                  setStep(1);
                }}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:border-teal-500 hover:bg-accent",
                  hospitalId === h.id && "border-teal-600 bg-teal-50 dark:bg-teal-950/30",
                )}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/50">
                  <Building2 className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{h.name}</span>
                    {hasRecommended && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-2 py-0.5 text-[11px] font-medium text-white">
                        <Star className="size-3" /> {tAppt("hasRecommendedSpecialty")}
                      </span>
                    )}
                  </span>
                  {h.city && <span className="mt-0.5 block text-sm text-muted-foreground">{h.city}</span>}
                </span>
              </button>
            );
          })}
          {sortedHospitals.length === 0 && (
            <p className="text-sm text-muted-foreground">{tAppt("noHospitals")}</p>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <Button variant="ghost" size="sm" onClick={() => setStep(0)} className="-ml-2">
            <ArrowLeft className="size-4" /> {tPatient("changeHospital")}
          </Button>
          {recommendedSpecialtyId && !hasRecommendedAtHospital && hospitalDoctors.length > 0 && (
            <p className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
              {tAppt("noRecommendedDoctor", {
                specialty: recommendedSpecialtyName ?? tAppt("recommendedFallback"),
              })}
            </p>
          )}
          <div className="grid gap-3">
            {hospitalDoctors.map((d) => {
              const recommended = recommendedSpecialtyId && d.specialty_id === recommendedSpecialtyId;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => selectDoctor(d)}
                  className="flex items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors hover:border-teal-500 hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-950/50">
                      <Stethoscope className="size-5" />
                    </span>
                    <div>
                      <p className="font-medium">{formatDoctorName(d.full_name)}</p>
                      <p className="text-sm text-muted-foreground">
                        {d.specialty_name ?? tAppt("generalSpecialty")}
                        {d.years_experience
                          ? ` · ${tAppt("yearsExperience", { years: d.years_experience })}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  {recommended && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-2 py-0.5 text-xs font-medium text-white">
                      <Star className="size-3" /> {tAppt("recommended")}
                    </span>
                  )}
                </button>
              );
            })}
            {hospitalDoctors.length === 0 && (
              <p className="text-sm text-muted-foreground">No doctors available at this hospital yet.</p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="-ml-2">
            <ArrowLeft className="size-4" /> {tPatient("changeDoctor")}
          </Button>
          {loadingSlots ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" /> {tAppt("loadingTimes")}
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
                          setSlotTaken(false);
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSlotTaken(false);
                setStep(2);
              }}
              className="-ml-2"
            >
              <ArrowLeft className="size-4" /> {tAppt("changeTime")}
            </Button>
            {slotTaken && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                {tAppt.rich("slotTakenNotice", {
                  action: (chunks) => <span className="font-medium">{chunks}</span>,
                })}
              </p>
            )}
            <div className="grid gap-3 rounded-lg bg-muted/50 p-4 text-sm">
              <Row label={tAppt("hospital")} value={hospitals.find((h) => h.id === hospitalId)?.name ?? "—"} />
              <Row label={tAppt("doctor")} value={formatDoctorName(doctor.full_name)} />
              <Row label={tAppt("time")} value={formatDateTime(slot)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">{tPatient("reason")}</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={tPatient("reason")}
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
