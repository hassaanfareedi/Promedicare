import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { getMyDoctor, getDoctorAppointments, type DoctorAppointment } from "@/features/doctor/data";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { AppointmentStatusControl } from "@/features/doctor/components/appointment-status-control";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Schedule" };

function groupByDay(rows: DoctorAppointment[]): [string, DoctorAppointment[]][] {
  const map = new Map<string, DoctorAppointment[]>();
  for (const r of rows) {
    const key = new Date(r.scheduled_start).toDateString();
    map.set(key, [...(map.get(key) ?? []), r]);
  }
  return [...map.entries()];
}

export default async function DoctorSchedulePage() {
  const [doctor, user] = await Promise.all([getMyDoctor(), getCurrentUser()]);
  const appointments = doctor
    ? await getDoctorAppointments(doctor.id, "upcoming", doctor.hospital_id)
    : [];
  const groups = groupByDay(appointments);
  const doctorName = user?.profile.full_name ?? "Doctor";

  return (
    <div className="space-y-6">
      <PageHeader title="Schedule" description="Your upcoming appointments." />

      {groups.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No upcoming appointments" description="New bookings will appear here." />
      ) : (
        <div className="space-y-6">
          {groups.map(([day, rows]) => (
            <div key={day} className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">{day}</h2>
              {rows.map((a) => (
                <Card key={a.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                    <div>
                      <p className="font-medium">{a.patient?.full_name ?? "Patient"}</p>
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
                        patientName={a.patient?.full_name ?? "Patient"}
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
