import type { DoctorAvailability } from "@/types";
import { formatTimeInZone, zonedDateParts, zonedWallTimeToUtc } from "@/lib/datetime";

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

const DEFAULT_TIME_ZONE = "Asia/Karachi";

function parseTime(t: string): { h: number; m: number } {
  const [h, m] = t.split(":");
  return { h: Number(h), m: Number(m ?? 0) };
}

function timeToMinutes(t: string): number {
  const { h, m } = parseTime(t);
  return h * 60 + m;
}

/** Wall-clock weekday (0=Sun) + minutes-from-midnight for `instant` in `timeZone`. */
export function zonedWeekdayAndMinutes(
  instant: Date,
  timeZone: string,
): { weekday: number; minutes: number } {
  const { year, month, day } = zonedDateParts(timeZone, instant);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return { weekday, minutes: hour * 60 + minute };
}

export type CoveringAvailability = Pick<
  DoctorAvailability,
  "weekday" | "start_time" | "end_time" | "slot_minutes" | "is_active"
>;

/**
 * Resolves the availability row that covers `start` in the hospital timezone
 * and returns that row's slot length. Mirrors buildSlots(): start must land on
 * a slot boundary and the visit must fit inside the window.
 *
 * Returns null when no active window covers the instant — callers must reject
 * the booking rather than falling back to a global min(slot_minutes), which
 * shortens longer visits and lets the overlap exclusion miss real conflicts.
 */
export function resolveCoveringSlotMinutes(
  availability: CoveringAvailability[],
  start: Date,
  timeZone = DEFAULT_TIME_ZONE,
): number | null {
  const zone = timeZone || DEFAULT_TIME_ZONE;
  const { weekday, minutes } = zonedWeekdayAndMinutes(start, zone);

  let best: number | null = null;
  for (const row of availability) {
    if (row.is_active === false) continue;
    if (row.weekday !== weekday) continue;
    const step = row.slot_minutes > 0 ? row.slot_minutes : 30;
    const windowStart = timeToMinutes(row.start_time);
    const windowEnd = timeToMinutes(row.end_time);
    if (minutes < windowStart || minutes >= windowEnd) continue;
    if ((minutes - windowStart) % step !== 0) continue;
    if (minutes + step > windowEnd) continue;
    if (best === null || step > best) best = step;
  }
  return best;
}

/**
 * Builds bookable slots for a doctor across the next `days` days from their
 * weekly availability, in the hospital's timezone. Patients can't see others'
 * bookings (RLS), so conflicts are resolved atomically at booking time by the
 * DB — we only produce candidate slots here and honour a minimum lead time.
 *
 * All wall-clock math (weekday, start/end times) is done in `timeZone` so the
 * slots match the hospital's day even when the server runs in UTC.
 */
export function buildSlots(
  availability: DoctorAvailability[],
  {
    days = 14,
    leadMinutes = 60,
    maxPerDay = 24,
    timeZone = DEFAULT_TIME_ZONE,
  }: { days?: number; leadMinutes?: number; maxPerDay?: number; timeZone?: string } = {},
): SlotGroup[] {
  const active = availability.filter((a) => a.is_active);
  if (active.length === 0) return [];

  const zone = timeZone || DEFAULT_TIME_ZONE;
  const now = new Date();
  const earliest = new Date(now.getTime() + leadMinutes * 60_000);
  const today = zonedDateParts(zone, now);
  const groups: SlotGroup[] = [];

  for (let i = 0; i < days; i++) {
    // Advance the calendar date in the hospital timezone. UTC midnight of a
    // calendar date yields the correct weekday regardless of the server zone.
    const base = new Date(Date.UTC(today.year, today.month - 1, today.day));
    base.setUTCDate(base.getUTCDate() + i);
    const y = base.getUTCFullYear();
    const mo = base.getUTCMonth() + 1;
    const d = base.getUTCDate();
    const weekday = base.getUTCDay();

    const rows = active.filter((a) => a.weekday === weekday);
    if (rows.length === 0) continue;

    const slots: { iso: string; label: string }[] = [];
    for (const row of rows) {
      const start = parseTime(row.start_time);
      const end = parseTime(row.end_time);
      const step = row.slot_minutes > 0 ? row.slot_minutes : 30;
      let cursor = zonedWallTimeToUtc(y, mo, d, start.h, start.m, 0, 0, zone);
      const stop = zonedWallTimeToUtc(y, mo, d, end.h, end.m, 0, 0, zone);

      while (cursor < stop && slots.length < maxPerDay) {
        if (cursor >= earliest) {
          slots.push({ iso: cursor.toISOString(), label: formatTimeInZone(cursor, zone) });
        }
        cursor = new Date(cursor.getTime() + step * 60_000);
      }
    }

    if (slots.length > 0) {
      slots.sort((a, b) => a.iso.localeCompare(b.iso));
      groups.push({
        date: `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        label: `${DAY_LABELS[weekday]}, ${MONTH_LABELS[mo - 1]} ${d}`,
        slots,
      });
    }
  }

  return groups;
}
