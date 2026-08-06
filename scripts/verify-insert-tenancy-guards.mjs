/**
 * Static checks that migration 0032 still encodes the critical guards.
 * Run: node scripts/verify-insert-tenancy-guards.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sql = readFileSync(
  join(root, "supabase/migrations/0032_lock_insert_tenancy_and_destruction.sql"),
  "utf8",
);

const required = [
  "guard_appointment_insert_tenancy",
  "Appointment doctor must belong to the appointment hospital",
  "Appointment patient must belong to the appointment hospital",
  "guard_appointment_schedule_change",
  "Appointment duration cannot be changed this way",
  "profile_id is null",
  "patients_delete",
  "doctors_delete",
  "using (public.is_super_admin())",
  "guard_consultation_note_soft_delete",
  "guard_payment_identity_change",
  "Payment appointment and hospital cannot be reassigned",
  "guard_appointment_checkin_fee_amount",
  "A non-zero fee payment is required before check-in",
];

for (const needle of required) {
  assert.match(sql, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

console.log("ok: 0032 insert-tenancy / destruction guards present");
