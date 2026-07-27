import { Stethoscope } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { StaffAppointment } from "@/features/reception/data";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime, formatDoctorName } from "@/lib/format";
import { AppointmentStatusControl } from "@/features/doctor/components/appointment-status-control";
import { RescheduleDialog } from "@/features/appointments/components/reschedule-dialog";

const ACTIVE = new Set(["pending", "confirmed"]);
const KNOWN_STATUSES = new Set([
  "pending",
  "confirmed",
  "checked_in",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
]);

export async function StaffAppointmentRow({
  a,
  allowReschedule = true,
}: {
  a: StaffAppointment;
  allowReschedule?: boolean;
}) {
  const [tStatus, tRoles, tReception] = await Promise.all([
    getTranslations("status"),
    getTranslations("roles"),
    getTranslations("reception"),
  ]);
  const statusKey = KNOWN_STATUSES.has(a.status) ? a.status : "unknown";
  const staffHint = tStatus(`${statusKey}Staff`);

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-950/50">
            <Stethoscope className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-medium">{a.patientName ?? tRoles("patient")}</p>
            <p className="text-xs text-muted-foreground">
              {a.patientCode} · {formatDateTime(a.scheduled_start)}
            </p>
            <p className="text-xs text-muted-foreground">
              {a.doctorName ? formatDoctorName(a.doctorName) : tReception("unassigned")}
              {a.specialtyName ? ` · ${a.specialtyName}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusBadge status={a.status} />
            {allowReschedule && ACTIVE.has(a.status) && (
              <RescheduleDialog appointmentId={a.id} doctorId={a.doctor_id} />
            )}
            <AppointmentStatusControl
              mode="reception"
              appointmentId={a.id}
              status={a.status}
              consultationFee={a.consultationFee}
            />
          </div>
          <p className="text-xs text-muted-foreground">{staffHint}</p>
        </div>
      </CardContent>
    </Card>
  );
}
