import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, CalendarPlus, MapPin, Stethoscope } from "lucide-react";
import { getMyAppointments, type AppointmentView } from "@/features/patient/data";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/format";
import { CancelAppointmentButton } from "@/features/appointments/components/cancel-appointment-button";

export const metadata: Metadata = { title: "Appointments" };

const CANCELLABLE = new Set(["pending", "confirmed"]);
const ACTIVE = new Set(["pending", "confirmed", "checked_in", "in_progress"]);

function AppointmentRow({ a }: { a: AppointmentView }) {
  const upcoming = new Date(a.scheduled_start) >= new Date() && ACTIVE.has(a.status);
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-950/50">
            <Stethoscope className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-medium">{a.doctorName ? `Dr. ${a.doctorName}` : "Doctor to be assigned"}</p>
            <p className="text-sm text-muted-foreground">{formatDateTime(a.scheduled_start)}</p>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {a.specialtyName && <span>{a.specialtyName}</span>}
              {a.hospitalName && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" /> {a.hospitalName}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={a.status} />
          {upcoming && CANCELLABLE.has(a.status) && <CancelAppointmentButton appointmentId={a.id} />}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AppointmentsPage() {
  const all = await getMyAppointments();
  const now = new Date();
  const upcoming = all
    .filter((a) => new Date(a.scheduled_start) >= now && ACTIVE.has(a.status))
    .sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start));
  const past = all.filter((a) => !(new Date(a.scheduled_start) >= now && ACTIVE.has(a.status)));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="View and manage your upcoming and past appointments."
        actions={
          <Link href="/patient/appointments/new" className={buttonVariants({ size: "sm" })}>
            <CalendarPlus className="size-4" /> Book appointment
          </Link>
        }
      />

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past &amp; other ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming appointments"
              description="Book a visit with a specialist."
              action={
                <Link href="/patient/appointments/new" className={buttonVariants({ size: "sm" })}>
                  <CalendarPlus className="size-4" /> Book appointment
                </Link>
              }
            />
          ) : (
            upcoming.map((a) => <AppointmentRow key={a.id} a={a} />)
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-3">
          {past.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Nothing here yet" description="Your past appointments will appear here." />
          ) : (
            past.map((a) => <AppointmentRow key={a.id} a={a} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
