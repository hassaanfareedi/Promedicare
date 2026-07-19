"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CalendarClock, Clock } from "lucide-react";
import { getDoctorSlots, rescheduleAppointment } from "@/features/appointments/actions";
import type { SlotGroup } from "@/features/appointments/slots";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function RescheduleDialog({
  appointmentId,
  doctorId,
}: {
  appointmentId: string;
  doctorId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState<SlotGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function load() {
    if (!doctorId) return;
    setLoading(true);
    try {
      setSlots(await getDoctorSlots(doctorId));
    } finally {
      setLoading(false);
    }
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) void load();
  }

  function choose(iso: string) {
    if (pending || loading) return;
    startTransition(async () => {
      const res = await rescheduleAppointment({ appointmentId, scheduledStart: iso });
      if (!res.ok) {
        toast.error(res.error);
        void load();
        return;
      }
      toast.success("Appointment rescheduled");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={!doctorId}
            title={!doctorId ? "Doctor not assigned yet" : undefined}
          >
            <CalendarClock className="size-4" aria-hidden /> Reschedule
          </Button>
        }
      />
      <DialogContent className="max-h-[80vh] overflow-y-auto overscroll-contain">
        <DialogHeader>
          <DialogTitle>Reschedule appointment</DialogTitle>
          <DialogDescription>Choose a new available time with the same doctor.</DialogDescription>
        </DialogHeader>
        {loading || pending ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground" role="status">
            <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />{" "}
            {pending ? "Rescheduling…" : "Loading times…"}
          </div>
        ) : slots.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No available times in the next two weeks.</p>
        ) : (
          <div className="space-y-4">
            {slots.map((group) => (
              <div key={group.date}>
                <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Clock className="size-4 text-teal-600" aria-hidden /> {group.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.slots.map((s) => (
                    <button
                      key={s.iso}
                      type="button"
                      disabled={pending}
                      onClick={() => choose(s.iso)}
                      className={cn(
                        "min-h-10 min-w-10 rounded-lg border px-3 py-2 text-sm transition-colors hover:border-teal-500 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
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
      </DialogContent>
    </Dialog>
  );
}
