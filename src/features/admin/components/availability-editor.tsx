"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, Loader2, Plus, Trash2 } from "lucide-react";
import { addAvailability, addAvailabilityBatch, removeAvailability } from "@/features/admin/actions";
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

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

function splitTime(value: string): { hour: string; minute: string } {
  const [h = "09", m = "00"] = value.split(":");
  return { hour: h.padStart(2, "0"), minute: m.padStart(2, "0").slice(0, 2) };
}

function TimeSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const { hour, minute } = splitTime(value);
  const minuteOptions = MINUTES.includes(minute) ? MINUTES : [...MINUTES, minute].sort();

  return (
    <div className="space-y-1">
      <Label className="text-xs" htmlFor={`${id}-hour`}>
        {label}
      </Label>
      <div className="flex items-center gap-1">
        <Select
          value={hour}
          onValueChange={(v) => onChange(`${v ?? hour}:${minute}`)}
          items={HOURS.map((h) => ({ value: h, label: h }))}
        >
          <SelectTrigger id={`${id}-hour`} className="w-[4.5rem]" aria-label={`${label} hour`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground" aria-hidden>
          :
        </span>
        <Select
          value={minute}
          onValueChange={(v) => onChange(`${hour}:${v ?? minute}`)}
          items={minuteOptions.map((m) => ({ value: m, label: m }))}
        >
          <SelectTrigger id={`${id}-minute`} className="w-[4.5rem]" aria-label={`${label} minute`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {minuteOptions.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

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

  function applyWeekdays() {
    startTransition(async () => {
      const res = await addAvailabilityBatch({
        doctorId: doctor.id,
        weekdays: [1, 2, 3, 4, 5],
        startTime: start,
        endTime: end,
        slotMinutes: Number(slot),
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const { added, skipped } = res.data ?? { added: 0, skipped: 0 };
      if (added === 0) {
        toast.message("Mon–Fri already scheduled", {
          description: skipped ? `${skipped} day(s) already had a slot.` : undefined,
        });
      } else {
        toast.success(
          skipped > 0
            ? `Added ${added} day(s); skipped ${skipped} already set`
            : `Added Mon–Fri (${added} days)`,
        );
      }
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
        <TimeSelect
          id={`avail-start-${doctor.id}`}
          label="Start"
          value={start}
          onChange={setStart}
        />
        <TimeSelect id={`avail-end-${doctor.id}`} label="End" value={end} onChange={setEnd} />
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
        <Button size="sm" variant="outline" onClick={applyWeekdays} disabled={pending}>
          Apply Mon–Fri
        </Button>
      </div>
    </div>
  );
}
