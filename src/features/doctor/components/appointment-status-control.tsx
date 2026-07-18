"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateAppointmentStatus } from "@/features/doctor/actions";
import type { AppointmentStatus } from "@/types";
import { Button } from "@/components/ui/button";

const NEXT_ACTIONS: Partial<Record<AppointmentStatus, { label: string; to: AppointmentStatus }[]>> = {
  pending: [
    { label: "Confirm", to: "confirmed" },
    { label: "Cancel", to: "cancelled" },
  ],
  confirmed: [
    { label: "Check in", to: "checked_in" },
    { label: "No show", to: "no_show" },
  ],
  checked_in: [{ label: "Start", to: "in_progress" }],
  in_progress: [{ label: "Complete", to: "completed" }],
};

export function AppointmentStatusControl({
  appointmentId,
  status,
}: {
  appointmentId: string;
  status: AppointmentStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const actions = NEXT_ACTIONS[status] ?? [];

  if (actions.length === 0) return null;

  function run(to: AppointmentStatus) {
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
  );
}
