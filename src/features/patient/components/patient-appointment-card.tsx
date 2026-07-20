import { CalendarDays, MapPin, Stethoscope } from "lucide-react";
import type { AppointmentView } from "@/features/patient/data";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAppointmentStatusMeta } from "@/lib/constants";
import { formatDateTime, formatDoctorName } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  appointment: AppointmentView;
  /** Emphasize as the next visit on the dashboard. */
  featured?: boolean;
  actions?: React.ReactNode;
  className?: string;
};

export function PatientAppointmentCard({
  appointment: a,
  featured = false,
  actions,
  className,
}: Props) {
  const hint = getAppointmentStatusMeta(a.status).hint;

  return (
    <Card
      className={cn(
        featured &&
          "border-teal-200/80 bg-gradient-to-br from-teal-50/80 via-background to-background shadow-sm dark:border-teal-900/50 dark:from-teal-950/30",
        className,
      )}
    >
      <CardContent
        className={cn(
          "flex flex-wrap items-start justify-between gap-4",
          featured ? "p-5 sm:p-6" : "p-4",
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "grid shrink-0 place-items-center rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300",
              featured ? "size-12" : "size-10",
            )}
            aria-hidden
          >
            {featured ? (
              <CalendarDays className="size-5" />
            ) : (
              <Stethoscope className="size-5" />
            )}
          </span>
          <div className="min-w-0 space-y-1">
            {featured ? (
              <p className="text-xs font-medium uppercase tracking-wide text-teal-800/80 dark:text-teal-300/80">
                Next visit
              </p>
            ) : null}
            <p className={cn("font-medium text-foreground", featured && "font-heading text-lg")}>
              {a.doctorName ? formatDoctorName(a.doctorName) : "Doctor to be assigned"}
            </p>
            <p className="text-sm text-foreground/70">{formatDateTime(a.scheduled_start)}</p>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-foreground/65">
              {a.specialtyName ? <span>{a.specialtyName}</span> : null}
              {a.hospitalName ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5 shrink-0" aria-hidden />
                  {a.hospitalName}
                </span>
              ) : null}
            </p>
            <p className="text-sm text-foreground/65">{hint}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={a.status} />
          {actions}
        </div>
      </CardContent>
    </Card>
  );
}
