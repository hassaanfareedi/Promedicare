import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, CalendarPlus } from "lucide-react";
import { getMyAppointments, type AppointmentView } from "@/features/patient/data";
import { PatientAppointmentCard } from "@/features/patient/components/patient-appointment-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CancelAppointmentButton } from "@/features/appointments/components/cancel-appointment-button";
import { RescheduleDialog } from "@/features/appointments/components/reschedule-dialog";

export const metadata: Metadata = { title: "Appointments" };

const CANCELLABLE = new Set(["pending", "confirmed"]);
const ACTIVE = new Set(["pending", "confirmed", "checked_in", "in_progress"]);

function AppointmentRow({ a }: { a: AppointmentView }) {
  const upcoming = new Date(a.scheduled_start) >= new Date() && ACTIVE.has(a.status);
  return (
    <PatientAppointmentCard
      appointment={a}
      actions={
        upcoming && CANCELLABLE.has(a.status) ? (
          <>
            <RescheduleDialog appointmentId={a.id} doctorId={a.doctor_id} />
            <CancelAppointmentButton appointmentId={a.id} />
          </>
        ) : undefined
      }
    />
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
    <div className="space-y-8">
      <PageHeader
        title="Appointments"
        description="See what is coming up, what the clinic confirmed, and manage your bookings."
        actions={
          <Link href="/patient/appointments/new" className={buttonVariants({ size: "default" })}>
            <CalendarPlus className="size-4" aria-hidden /> Book appointment
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
              description="Book a visit with a specialist when you are ready."
              action={
                <Link href="/patient/appointments/new" className={buttonVariants({ size: "default" })}>
                  <CalendarPlus className="size-4" aria-hidden /> Book appointment
                </Link>
              }
            />
          ) : (
            upcoming.map((a) => <AppointmentRow key={a.id} a={a} />)
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-3">
          {past.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nothing here yet"
              description="Completed and cancelled visits will show up here."
            />
          ) : (
            past.map((a) => <AppointmentRow key={a.id} a={a} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
