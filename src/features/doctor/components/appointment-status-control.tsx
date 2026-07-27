"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateAppointmentStatus } from "@/features/doctor/actions";
import type { AppointmentStatus } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConsultWizard } from "@/features/doctor/components/consult-wizard";
import { CheckInFeeDialog } from "@/features/reception/components/check-in-fee-dialog";

export type StatusControlMode = "doctor" | "reception";

/** Terminal transitions that can't be undone — always ask before firing. */
const IRREVERSIBLE: Partial<Record<AppointmentStatus, { titleKey: string; bodyKey: string }>> = {
  cancelled: {
    titleKey: "cancelApptTitle",
    bodyKey: "cancelApptBody",
  },
  no_show: {
    titleKey: "noShowTitle",
    bodyKey: "noShowBody",
  },
};

const DOCTOR_ACTIONS: Partial<Record<AppointmentStatus, { labelKey: string; to: AppointmentStatus }[]>> = {
  checked_in: [{ labelKey: "actionStart", to: "in_progress" }],
  in_progress: [{ labelKey: "actionComplete", to: "completed" }],
};

const RECEPTION_ACTIONS: Partial<
  Record<AppointmentStatus, { labelKey: string; to: AppointmentStatus }[]>
> = {
  pending: [
    { labelKey: "actionConfirm", to: "confirmed" },
    { labelKey: "actionCancel", to: "cancelled" },
  ],
  confirmed: [
    { labelKey: "actionCheckIn", to: "checked_in" },
    { labelKey: "actionNoShow", to: "no_show" },
  ],
  checked_in: [
    { labelKey: "actionCancel", to: "cancelled" },
    { labelKey: "actionNoShow", to: "no_show" },
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
  const t = useTranslations("doctor");
  const tc = useTranslations("common");
  const tr = useTranslations("roles");
  const [pending, startTransition] = useTransition();
  const [consultOpen, setConsultOpen] = useState(false);
  const [feeOpen, setFeeOpen] = useState(false);
  const [confirmTo, setConfirmTo] = useState<AppointmentStatus | null>(null);

  const actions = (mode === "doctor" ? DOCTOR_ACTIONS : RECEPTION_ACTIONS)[status] ?? [];

  if (mode === "doctor" && status === "confirmed" && !consultOpen && !feeOpen) {
    return (
      <p className="max-w-[12rem] text-xs text-muted-foreground">
        {t("waitingReceptionCheckIn")}
      </p>
    );
  }

  if (mode === "doctor" && status === "pending" && !consultOpen && !feeOpen) {
    return (
      <p className="max-w-[12rem] text-xs text-muted-foreground">
        {t("awaitingClinicConfirmation")}
      </p>
    );
  }

  if (actions.length === 0 && !consultOpen && !feeOpen) return null;

  function run(to: AppointmentStatus) {
    if (mode === "doctor" && to === "completed") {
      if (!patientId || !patientName) {
        toast.error(t("patientDetailsRequired"));
        return;
      }
      setConsultOpen(true);
      return;
    }
    if (mode === "reception" && to === "checked_in") {
      setFeeOpen(true);
      return;
    }
    if (IRREVERSIBLE[to]) {
      setConfirmTo(to);
      return;
    }
    execute(to);
  }

  function execute(to: AppointmentStatus) {
    startTransition(async () => {
      const res = await updateAppointmentStatus({ appointmentId, status: to });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setConfirmTo(null);
      toast.success(t("appointmentUpdated"));
      router.refresh();
    });
  }

  const confirmMeta = confirmTo ? IRREVERSIBLE[confirmTo] : null;

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
            {t(a.labelKey)}
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
          doctorName={doctorName ?? tr("doctor")}
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

      <Dialog
        open={confirmTo !== null}
        onOpenChange={(next) => {
          if (!next && !pending) setConfirmTo(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmMeta ? t(confirmMeta.titleKey) : t("areYouSure")}</DialogTitle>
            <DialogDescription>{confirmMeta ? t(confirmMeta.bodyKey) : ""}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={pending} />}>
              {t("keepAppointment")}
            </DialogClose>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => confirmTo && execute(confirmTo)}
            >
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {tc("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
