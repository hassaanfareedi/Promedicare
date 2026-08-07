/**
 * Static checks that migration 0033 still encodes the critical guards.
 * Run: node scripts/verify-appointment-delete-doctor-writes.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sql = readFileSync(
  join(root, "supabase/migrations/0033_lock_appointment_delete_and_doctor_writes.sql"),
  "utf8",
);

const required = [
  "appointments_delete",
  "using (public.is_super_admin())",
  "appointments_insert",
  "appointments_update",
  "current_role() in ('hospital_admin', 'receptionist')",
  "doctor_id = public.current_doctor_id()",
  "patient_id = public.current_patient_id()",
];

for (const needle of required) {
  assert.match(sql, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

// Doctors must not inherit hospital-wide writes via is_staff() on update/insert.
assert.doesNotMatch(
  sql,
  /create policy appointments_update[\s\S]*is_staff\(\)/,
);
assert.doesNotMatch(
  sql,
  /create policy appointments_insert[\s\S]*is_staff\(\)/,
);

console.log("ok: 0033 appointment delete / doctor write guards present");
