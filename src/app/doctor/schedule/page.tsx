import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CalendarDays } from "lucide-react";
import { getMyDoctor, getDoctorAppointments, type DoctorAppointment } from "@/features/doctor/data";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/format";
import { AppointmentStatusControl } from "@/features/doctor/components/appointment-status-control";
import { getCurrentUser } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("doctor");
  return { title: t("scheduleTitle") };
}

function groupByDay(rows: DoctorAppointment[]): [string, DoctorAppointment[]][] {
  const map = new Map<string, DoctorAppointment[]>();
  for (const r of rows) {
    const key = new Date(r.scheduled_start).toDateString();
    map.set(key, [...(map.get(key) ?? []), r]);
  }
  return [...map.entries()];
}

export default async function DoctorSchedulePage() {
  const [t, tr] = await Promise.all([getTranslations("doctor"), getTranslations("roles")]);
  const [doctor, user] = await Promise.all([getMyDoctor(), getCurrentUser()]);
  const appointments = doctor
    ? await getDoctorAppointments(doctor.id, "upcoming", doctor.hospital_id)
    : [];
  const groups = groupByDay(appointments);
  const doctorName = user?.profile.full_name ?? tr("doctor");

  return (
    <div className="space-y-8">
      <PageHeader title={t("scheduleTitle")} description={t("scheduleDesc")} />

      {groups.length === 0 ? (
        <EmptyState icon={CalendarDays} title={t("noUpcomingTitle")} description={t("noUpcomingDesc")} />
      ) : (
        <div className="space-y-6">
          {groups.map(([day, rows]) => (
            <div key={day} className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                {formatDate(rows[0]?.scheduled_start)}
              </h2>
              {rows.map((a) => (
                <Card key={a.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                    <div>
                      <p className="font-medium">{a.patient?.full_name ?? tr("patient")}</p>
                      <p className="text-sm text-muted-foreground">{formatDateTime(a.scheduled_start)}</p>
                      {a.reason && <p className="mt-1 text-sm text-muted-foreground">{a.reason}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={a.status} />
                      <AppointmentStatusControl
                        mode="doctor"
                        appointmentId={a.id}
                        status={a.status}
                        patientId={a.patient?.id ?? a.patient_id}
                        patientName={a.patient?.full_name ?? tr("patient")}
                        patientCode={a.patient?.patient_code}
                        doctorName={doctorName}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
