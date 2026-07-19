"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, Loader2, Plus, Trash2 } from "lucide-react";
import { addAvailability, removeAvailability } from "@/features/admin/actions";
import type { AdminDoctor } from "@/features/admin/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function AvailabilityEditor({ doctor }: { doctor: AdminDoctor }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [weekday, setWeekday] = useState("1");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [slot, setSlot] = useState("30");

  function add() {
    startTransition(async () => {
      const res = await addAvailability({
        doctorId: doctor.id,
        weekday: Number(weekday),
        startTime: start,
        endTime: end,
        slotMinutes: Number(slot),
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Availability added");
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await removeAvailability(id);
      if (!res.ok) toast.error(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="rounded-lg border p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Clock className="size-4 text-teal-600" aria-hidden /> Weekly availability
      </p>

      {doctor.availability.length > 0 ? (
        <ul className="mb-3 space-y-1.5">
          {[...doctor.availability]
            .sort((a, b) => a.weekday - b.weekday)
            .map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                <span>
                  {WEEKDAYS[a.weekday]} · {a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)} (
                  {a.slot_minutes}m)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(a.id)}
                  disabled={pending}
                  aria-label={`Remove ${WEEKDAYS[a.weekday]} availability`}
                >
                  <Trash2 className="size-4 text-destructive" aria-hidden />
                </Button>
              </li>
            ))}
        </ul>
      ) : (
        <p className="mb-3 text-sm text-muted-foreground">No availability set.</p>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label className="text-xs" htmlFor={`avail-day-${doctor.id}`}>
            Day
          </Label>
          <Select
            value={weekday}
            onValueChange={(v) => setWeekday(v ?? "1")}
            items={WEEKDAYS.map((w, i) => ({ value: String(i), label: w }))}
          >
            <SelectTrigger id={`avail-day-${doctor.id}`} className="w-32" aria-label="Day">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAYS.map((w, i) => (
                <SelectItem key={i} value={String(i)}>
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs" htmlFor={`avail-start-${doctor.id}`}>
            Start
          </Label>
          <Input
            id={`avail-start-${doctor.id}`}
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-28"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs" htmlFor={`avail-end-${doctor.id}`}>
            End
          </Label>
          <Input
            id={`avail-end-${doctor.id}`}
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-28"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs" htmlFor={`avail-slot-${doctor.id}`}>
            Slot (min)
          </Label>
          <Input
            id={`avail-slot-${doctor.id}`}
            type="number"
            min={5}
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            className="w-20"
          />
        </div>
        <Button size="sm" onClick={add} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
          Add
        </Button>
      </div>
    </div>
  );
}
