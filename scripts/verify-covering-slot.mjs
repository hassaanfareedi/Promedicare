/**
 * Lightweight checks for resolveCoveringSlotMinutes (no test runner in repo).
 * Run: node --experimental-strip-types scripts/verify-covering-slot.mjs
 * Fallback: transpile via dynamic import of the TS module when strip-types works.
 */
import assert from "node:assert/strict";

const zone = "Asia/Karachi";

function parseTime(t) {
  const [h, m] = t.split(":");
  return { h: Number(h), m: Number(m ?? 0) };
}

function timeToMinutes(t) {
  const { h, m } = parseTime(t);
  return h * 60 + m;
}

function zonedDateParts(timeZone, now) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? "00";
  return { year: Number(get("year")), month: Number(get("month")), day: Number(get("day")) };
}

function getTimeZoneOffsetMs(date, timeZone) {
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
  const match = tzName.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? "0");
  return sign * (hours * 60 + minutes) * 60_000;
}

function zonedWallTimeToUtc(year, month, day, hour, minute, second, ms, timeZone) {
  let utc = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  for (let i = 0; i < 3; i++) {
    const offsetMs = getTimeZoneOffsetMs(new Date(utc), timeZone);
    const next = Date.UTC(year, month - 1, day, hour, minute, second, ms) - offsetMs;
    if (next === utc) break;
    utc = next;
  }
  return new Date(utc);
}

function zonedWeekdayAndMinutes(instant, timeZone) {
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

function resolveCoveringSlotMinutes(availability, start, timeZone = zone) {
  const { weekday, minutes } = zonedWeekdayAndMinutes(start, timeZone);
  let best = null;
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

// Monday 2026-08-03 in Asia/Karachi
const monday = zonedWallTimeToUtc(2026, 8, 3, 9, 0, 0, 0, zone);
assert.equal(zonedWeekdayAndMinutes(monday, zone).weekday, 1);

const availability = [
  { weekday: 1, start_time: "09:00:00", end_time: "12:00:00", slot_minutes: 60, is_active: true },
  { weekday: 2, start_time: "09:00:00", end_time: "12:00:00", slot_minutes: 15, is_active: true },
];

// Bug regression: global min(slot_minutes) would return 15 for Monday 9:00.
assert.equal(resolveCoveringSlotMinutes(availability, monday, zone), 60);

const monday1015 = zonedWallTimeToUtc(2026, 8, 3, 10, 15, 0, 0, zone);
assert.equal(resolveCoveringSlotMinutes(availability, monday1015, zone), null);

const tuesday = zonedWallTimeToUtc(2026, 8, 4, 9, 15, 0, 0, zone);
assert.equal(resolveCoveringSlotMinutes(availability, tuesday, zone), 15);

const outside = zonedWallTimeToUtc(2026, 8, 3, 3, 0, 0, 0, zone);
assert.equal(resolveCoveringSlotMinutes(availability, outside, zone), null);

console.log("verify-covering-slot: ok");
