/**
 * Static checks for online-booking hospital membership + doctor re-hire revive.
 * Run: node scripts/verify-tenant-membership-and-doctor-revive.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const booking = readFileSync(join(root, "src/features/appointments/actions.ts"), "utf8");
assert.match(
  booking,
  /from\("patients"\)[\s\S]*?\.update\(\{\s*hospital_id:\s*v\.hospitalId\s*\}\)[\s\S]*?\.eq\("profile_id",\s*user\.id\)[\s\S]*?\.is\("hospital_id",\s*null\)/,
  "bookAppointment must set patients.hospital_id on first booking",
);
assert.match(
  booking,
  /from\("profiles"\)[\s\S]*?\.update\(\{\s*hospital_id:\s*v\.hospitalId\s*\}\)/,
  "bookAppointment must still set profiles.hospital_id when unassigned",
);

const addDoctor = readFileSync(join(root, "src/features/admin/actions.ts"), "utf8");
assert.match(
  addDoctor,
  /existingDoctor\?\.deleted_at/,
  "addDoctor must detect a soft-deleted clinical row for re-hire",
);
assert.match(
  addDoctor,
  /deleted_at:\s*null/,
  "addDoctor must clear deleted_at when reviving a retired doctor",
);
assert.match(
  addDoctor,
  /action:\s*"doctor\.revived"/,
  "addDoctor must audit revive separately from create",
);

const promotable = readFileSync(join(root, "src/features/admin/data.ts"), "utf8");
assert.match(
  promotable,
  /\.eq\("hospital_id",\s*hid\)/,
  "getPromotableProfiles must include profiles.hospital_id members (demoted staff)",
);
assert.match(
  promotable,
  /from\("patients"\)[\s\S]*?\.eq\("hospital_id",\s*hid\)/,
  "getPromotableProfiles must still resolve membership via patients.hospital_id",
);

console.log("verify-tenant-membership-and-doctor-revive: ok");
