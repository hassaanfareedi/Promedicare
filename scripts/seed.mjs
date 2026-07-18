// ProMediCare AI - demo seed (idempotent).
// Creates six confirmed demo logins and enough data for every screen to render.
//
// Run: node --env-file=.env.local scripts/seed.mjs
//
// Requires SUPABASE_SERVICE_ROLE_KEY (server-only). Never ship this to the client.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = "Promedicare#2026";

function die(step, error) {
  if (error) {
    console.error(`\u2717 ${step}:`, error.message ?? error);
    process.exit(1);
  }
}

/** Create the auth user if missing, return its id. Marks email confirmed. */
async function ensureUser(email, fullName) {
  const { data: list, error: listErr } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  die("list users", listErr);
  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    await sb.auth.admin.updateUserById(existing.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    return existing.id;
  }
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  die(`create user ${email}`, error);
  return data.user.id;
}

async function setProfile(id, fields) {
  const { error } = await sb.from("profiles").update(fields).eq("id", id);
  die("update profile", error);
}

async function upsert(table, row, onConflict) {
  const { data, error } = await sb.from(table).upsert(row, { onConflict }).select().single();
  die(`upsert ${table}`, error);
  return data;
}

async function main() {
  console.log("Seeding ProMediCare AI demo data...\n");

  // Hospitals ---------------------------------------------------------------
  const central = await upsert(
    "hospitals",
    { name: "Central Care Hospital", slug: "central-care", city: "Karachi", timezone: "Asia/Karachi", is_active: true },
    "slug",
  );
  const riverside = await upsert(
    "hospitals",
    { name: "Riverside Medical Center", slug: "riverside-medical", city: "Lahore", timezone: "Asia/Karachi", is_active: true },
    "slug",
  );

  // Specialties -------------------------------------------------------------
  const specs = {};
  for (const s of [
    { name: "Cardiology", slug: "cardiology", description: "Heart and vascular care" },
    { name: "Dermatology", slug: "dermatology", description: "Skin, hair and nails" },
    { name: "Neurology", slug: "neurology", description: "Brain and nervous system" },
    { name: "General Medicine", slug: "general-medicine", description: "Primary and internal medicine" },
    { name: "Pediatrics", slug: "pediatrics", description: "Child and adolescent health" },
    { name: "Orthopedics", slug: "orthopedics", description: "Bones, joints and muscles" },
  ]) {
    specs[s.slug] = await upsert("specialties", s, "slug");
  }

  // Departments (Central) ---------------------------------------------------
  const cardioDept = await upsert(
    "departments",
    { hospital_id: central.id, name: "Cardiology", description: "Cardiology department", is_active: true },
    "hospital_id,name",
  );
  await upsert(
    "departments",
    { hospital_id: central.id, name: "General Medicine", description: "General medicine department", is_active: true },
    "hospital_id,name",
  );
  await upsert(
    "departments",
    { hospital_id: riverside.id, name: "Neurology", description: "Neurology department", is_active: true },
    "hospital_id,name",
  );

  // Users + profiles --------------------------------------------------------
  const superId = await ensureUser("superadmin@promedicare.test", "Sana Superadmin");
  await setProfile(superId, { role: "super_admin", hospital_id: null, full_name: "Sana Superadmin", onboarding_completed: true });

  const adminId = await ensureUser("admin@promedicare.test", "Adnan Admin");
  await setProfile(adminId, { role: "hospital_admin", hospital_id: central.id, full_name: "Adnan Admin", onboarding_completed: true });

  const doctorId = await ensureUser("doctor@promedicare.test", "Dua Rahman");
  await setProfile(doctorId, { role: "doctor", hospital_id: central.id, full_name: "Dua Rahman", onboarding_completed: true });

  const recepId = await ensureUser("reception@promedicare.test", "Rida Reception");
  await setProfile(recepId, { role: "receptionist", hospital_id: central.id, full_name: "Rida Reception", onboarding_completed: true });

  const patientId = await ensureUser("patient@promedicare.test", "Parsa Patient");
  await setProfile(patientId, { role: "patient", hospital_id: central.id, full_name: "Parsa Patient", onboarding_completed: true });

  // Doctor record + availability -------------------------------------------
  const doctor = await upsert(
    "doctors",
    {
      profile_id: doctorId,
      hospital_id: central.id,
      department_id: cardioDept.id,
      specialty_id: specs["cardiology"].id,
      license_number: "PMDC-DEMO-001",
      bio: "Consultant cardiologist with a focus on preventive heart care.",
      consultation_fee: 3500,
      years_experience: 12,
      is_active: true,
    },
    "profile_id",
  );

  await sb.from("doctor_availability").delete().eq("doctor_id", doctor.id);
  const availability = [1, 2, 3, 4, 5].map((weekday) => ({
    doctor_id: doctor.id,
    weekday,
    start_time: "09:00",
    end_time: "17:00",
    slot_minutes: 30,
    is_active: true,
  }));
  die("insert availability", (await sb.from("doctor_availability").insert(availability)).error);

  // Patients ----------------------------------------------------------------
  const patient = await upsert(
    "patients",
    {
      profile_id: patientId,
      hospital_id: central.id,
      patient_code: "PMC-200001",
      full_name: "Parsa Patient",
      dob: "1990-05-14",
      gender: "female",
      blood_group: "O+",
      phone: "+15551230001",
      email: "patient@promedicare.test",
    },
    "profile_id",
  );

  const walkIn = await upsert(
    "patients",
    {
      hospital_id: central.id,
      patient_code: "PMC-200002",
      full_name: "Wasay Khan",
      dob: "1978-11-02",
      gender: "male",
      blood_group: "A+",
      phone: "+15551230002",
    },
    "patient_code",
  );

  // Prediction (screening) for the login patient ---------------------------
  const { count: predCount } = await sb
    .from("predictions")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", patient.id);
  if (!predCount) {
    die(
      "insert prediction",
      (
        await sb.from("predictions").insert({
          patient_id: patient.id,
          hospital_id: central.id,
          created_by: patientId,
          model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          risk_level: "medium",
          confidence: 0.62,
          explanation:
            "Reported chest tightness and occasional shortness of breath on exertion suggest a cardiology review is prudent. This is decision support only, not a diagnosis.",
          predicted_conditions: [
            { condition: "Stable angina (possible)", likelihood: 0.5 },
            { condition: "Anxiety-related symptoms", likelihood: 0.3 },
          ],
          input_symptoms: ["chest tightness", "shortness of breath", "fatigue"],
          input_text: "Chest tightness when climbing stairs for the past week.",
          recommended_specialty_id: specs["cardiology"].id,
          recommended_specialty_label: "Cardiology",
          status: "pending_review",
        })
      ).error,
    );
  }

  // Appointments ------------------------------------------------------------
  const start = new Date();
  start.setDate(start.getDate() + 2);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start.getTime() + 30 * 60_000);

  const { count: apptCount } = await sb
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", patient.id)
    .eq("doctor_id", doctor.id);
  if (!apptCount) {
    const { error } = await sb.from("appointments").insert({
      hospital_id: central.id,
      patient_id: patient.id,
      doctor_id: doctor.id,
      department_id: cardioDept.id,
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      status: "confirmed",
      source: "online",
      reason: "Cardiology follow-up for chest tightness",
      created_by: patientId,
    });
    if (error && error.code !== "23P01") die("insert appointment", error);
  }

  // A past, completed walk-in appointment for variety in lists.
  const past = new Date();
  past.setDate(past.getDate() - 7);
  past.setHours(11, 0, 0, 0);
  const pastEnd = new Date(past.getTime() + 30 * 60_000);
  const { count: pastCount } = await sb
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", walkIn.id);
  if (!pastCount) {
    const { error } = await sb.from("appointments").insert({
      hospital_id: central.id,
      patient_id: walkIn.id,
      doctor_id: doctor.id,
      scheduled_start: past.toISOString(),
      scheduled_end: pastEnd.toISOString(),
      status: "completed",
      source: "walk_in",
      reason: "General check-up",
      created_by: recepId,
      checked_in_at: past.toISOString(),
      checked_out_at: pastEnd.toISOString(),
    });
    if (error && error.code !== "23P01") die("insert past appointment", error);
  }

  console.log("\n\u2713 Seed complete.\n");
  console.log("Demo logins (password for all):", DEMO_PASSWORD);
  console.log("  Super Admin     superadmin@promedicare.test");
  console.log("  Hospital Admin  admin@promedicare.test");
  console.log("  Doctor          doctor@promedicare.test");
  console.log("  Receptionist    reception@promedicare.test");
  console.log("  Patient         patient@promedicare.test");
  console.log("\nVisitor lookup: PMC-200001 + DOB 1990-05-14 (or phone +15551230001)");
  console.log("                PMC-200002 + DOB 1978-11-02 (or phone +15551230002)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
