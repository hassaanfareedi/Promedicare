/** Calendar Y/M/D for `now` as seen in `timeZone`. */
export function zonedDateParts(
  timeZone: string,
  now = new Date(),
): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  return { year: Number(get("year")), month: Number(get("month")), day: Number(get("day")) };
}

/** Format the wall-clock time of a UTC instant as seen in `timeZone` (e.g. "9:30 AM"). */
export function formatTimeInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Calendar day bounds in an IANA timezone (e.g. Asia/Karachi).
 * Avoids Vercel UTC midnight skew for "today" dashboards.
 */
export function dayBoundsInTimeZone(
  timeZone: string,
  now = new Date(),
): { startIso: string; endIso: string } {
  const { year: y, month: m, day: d } = zonedDateParts(timeZone, now);

  const startUtc = zonedWallTimeToUtc(y, m, d, 0, 0, 0, 0, timeZone);
  const endUtc = zonedWallTimeToUtc(y, m, d, 23, 59, 59, 999, timeZone);

  return { startIso: startUtc.toISOString(), endIso: endUtc.toISOString() };
}

/** Convert a wall-clock time in `timeZone` to a UTC Date. */
export function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  ms: number,
  timeZone: string,
): Date {
  // Initial guess: treat components as UTC, then correct by zone offset.
  let utc = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  for (let i = 0; i < 3; i++) {
    const offsetMs = getTimeZoneOffsetMs(new Date(utc), timeZone);
    const next = Date.UTC(year, month - 1, day, hour, minute, second, ms) - offsetMs;
    if (next === utc) break;
    utc = next;
  }
  return new Date(utc);
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = dtf.formatToParts(date);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  // e.g. "GMT+5", "GMT+05:30", "GMT-4"
  const match = tzName.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? "0");
  return sign * (hours * 60 + minutes) * 60_000;
}
