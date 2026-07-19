"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateAppointmentStatus } from "@/features/doctor/actions";
import type { AppointmentStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { ConsultWizard } from "@/features/doctor/components/consult-wizard";
import { CheckInFeeDialog } from "@/features/reception/components/check-in-fee-dialog";

export type StatusControlMode = "doctor" | "reception";

const DOCTOR_ACTIONS: Partial<Record<AppointmentStatus, { label: string; to: AppointmentStatus }[]>> = {
  checked_in: [{ label: "Start", to: "in_progress" }],
  in_progress: [{ label: "Complete", to: "completed" }],
};

const RECEPTION_ACTIONS: Partial<
  Record<AppointmentStatus, { label: string; to: AppointmentStatus }[]>
> = {
  pending: [
    { label: "Confirm", to: "confirmed" },
    { label: "Cancel", to: "cancelled" },
  ],
  confirmed: [
    { label: "Check in", to: "checked_in" },
    { label: "No show", to: "no_show" },
  ],
};

export function AppointmentStatusControl({
  appointmentId,
  status,
  mode = "doctor",
  patientId,
  patientName,
  patientCode,
  doctorName,
  consultationFee,
}: {
  appointmentId: string;
  status: AppointmentStatus;
  mode?: StatusControlMode;
  patientId?: string;
  patientName?: string;
  patientCode?: string | null;
  doctorName?: string;
  consultationFee?: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [consultOpen, setConsultOpen] = useState(false);
  const [feeOpen, setFeeOpen] = useState(false);

  const actions = (mode === "doctor" ? DOCTOR_ACTIONS : RECEPTION_ACTIONS)[status] ?? [];

  if (mode === "doctor" && status === "confirmed" && !consultOpen && !feeOpen) {
    return (
      <p className="max-w-[12rem] text-xs text-muted-foreground">
        Waiting for reception check-in
      </p>
    );
  }

  if (mode === "doctor" && status === "pending" && !consultOpen && !feeOpen) {
    return (
      <p className="max-w-[12rem] text-xs text-muted-foreground">
        Awaiting clinic confirmation
      </p>
    );
  }

  if (actions.length === 0 && !consultOpen && !feeOpen) return null;

  function run(to: AppointmentStatus) {
    if (mode === "doctor" && to === "completed") {
      if (!patientId || !patientName) {
        toast.error("Patient details are required to complete the visit.");
        return;
      }
      setConsultOpen(true);
      return;
    }
    if (mode === "reception" && to === "checked_in") {
      setFeeOpen(true);
      return;
    }

    startTransition(async () => {
      const res = await updateAppointmentStatus({ appointmentId, status: to });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Appointment updated");
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        {actions.map((a) => (
          <Button
            key={a.to}
            size="sm"
            variant={a.to === "cancelled" || a.to === "no_show" ? "outline" : "default"}
            disabled={pending}
            onClick={() => run(a.to)}
          >
            {a.label}
          </Button>
        ))}
      </div>

      {mode === "doctor" && patientId && patientName && (
        <ConsultWizard
          open={consultOpen}
          onOpenChange={setConsultOpen}
          appointmentId={appointmentId}
          patientId={patientId}
          patientName={patientName}
          patientCode={patientCode}
          doctorName={doctorName ?? "Doctor"}
        />
      )}

      {mode === "reception" && (
        <CheckInFeeDialog
          open={feeOpen}
          onOpenChange={setFeeOpen}
          appointmentId={appointmentId}
          defaultFee={consultationFee}
        />
      )}
    </>
  );
}
