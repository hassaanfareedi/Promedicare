import type { DoctorAvailability } from "@/types";

export type SlotGroup = {
  date: string; // yyyy-mm-dd
  label: string; // e.g. "Mon, Aug 4"
  slots: { iso: string; label: string }[];
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function parseTime(t: string): { h: number; m: number } {
  const [h, m] = t.split(":");
  return { h: Number(h), m: Number(m ?? 0) };
}

function fmtTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

/**
 * Builds bookable slots for a doctor across the next `days` days from their
 * weekly availability. Patients can't see others' bookings (RLS), so conflicts
 * are resolved atomically at booking time by the DB — we only produce candidate
 * slots here and honour a minimum lead time.
 */
export function buildSlots(
  availability: DoctorAvailability[],
  { days = 14, leadMinutes = 60, maxPerDay = 24 }: { days?: number; leadMinutes?: number; maxPerDay?: number } = {},
): SlotGroup[] {
  const active = availability.filter((a) => a.is_active);
  if (active.length === 0) return [];

  const now = new Date();
  const earliest = new Date(now.getTime() + leadMinutes * 60_000);
  const groups: SlotGroup[] = [];

  for (let i = 0; i < days; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const weekday = day.getDay();
    const rows = active.filter((a) => a.weekday === weekday);
    if (rows.length === 0) continue;

    const slots: { iso: string; label: string }[] = [];
    for (const row of rows) {
      const start = parseTime(row.start_time);
      const end = parseTime(row.end_time);
      const step = row.slot_minutes > 0 ? row.slot_minutes : 30;
      const cursor = new Date(day);
      cursor.setHours(start.h, start.m, 0, 0);
      const stop = new Date(day);
      stop.setHours(end.h, end.m, 0, 0);

      while (cursor < stop && slots.length < maxPerDay) {
        if (cursor >= earliest) {
          slots.push({ iso: cursor.toISOString(), label: fmtTime(cursor) });
        }
        cursor.setMinutes(cursor.getMinutes() + step);
      }
    }

    if (slots.length > 0) {
      slots.sort((a, b) => a.iso.localeCompare(b.iso));
      groups.push({
        date: `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`,
        label: `${DAY_LABELS[weekday]}, ${MONTH_LABELS[day.getMonth()]} ${day.getDate()}`,
        slots,
      });
    }
  }

  return groups;
}
