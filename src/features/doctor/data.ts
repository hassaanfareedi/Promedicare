import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import type { Appointment, Doctor, Patient, Prediction } from "@/types";

export type DoctorAppointment = Appointment & {
  patient: Pick<Patient, "id" | "full_name" | "patient_code"> | null;
};

export type PredictionWithPatient = Prediction & {
  patient: Pick<Patient, "id" | "full_name" | "patient_code"> | null;
};

/** The signed-in doctor's own record. */
export async function getMyDoctor(): Promise<Doctor | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("doctors")
    .select("id, hospital_id, profile_id, specialty_id, department_id, license_number, years_experience, consultation_fee, bio, is_active, created_at, updated_at, deleted_at")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfToday(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

/** Appointments assigned to a doctor within a time window. */
export async function getDoctorAppointments(
  doctorId: string,
  range: "today" | "upcoming" | "all" = "all",
): Promise<DoctorAppointment[]> {
  const supabase = await createClient();
  let query = supabase
    .from("appointments")
    .select(
      "id, hospital_id, patient_id, doctor_id, department_id, status, scheduled_start, scheduled_end, reason, source, queue_number, notes, prediction_id, checked_in_at, checked_out_at, cancelled_at, cancelled_reason, created_at, updated_at, deleted_at, created_by, patient:patients(id, full_name, patient_code)",
    )
    .eq("doctor_id", doctorId)
    .is("deleted_at", null);

  if (range === "today") {
    query = query.gte("scheduled_start", startOfToday()).lte("scheduled_start", endOfToday());
  } else if (range === "upcoming") {
    query = query.gte("scheduled_start", new Date().toISOString());
  }

  const { data } = await query.order("scheduled_start", { ascending: range !== "all" });
  return (data ?? []) as DoctorAppointment[];
}

/** Distinct patients this doctor can access. */
export async function getDoctorPatients(): Promise<Patient[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("patients")
    .select("*")
    .is("deleted_at", null)
    .order("full_name");
  return data ?? [];
}

/** AI screenings visible to this doctor, optionally filtered by review status. */
export async function getReviewablePredictions(
  onlyPending = false,
): Promise<PredictionWithPatient[]> {
  const supabase = await createClient();
  let query = supabase
    .from("predictions")
    .select("*, patient:patients(id, full_name, patient_code)")
    .is("deleted_at", null);
  if (onlyPending) query = query.eq("status", "pending_review");
  const { data } = await query.order("created_at", { ascending: false }).limit(100);
  return (data ?? []) as PredictionWithPatient[];
}

export type DoctorOverview = {
  doctor: Doctor | null;
  displayName: string | null;
  today: DoctorAppointment[];
  pendingReviews: number;
  patientCount: number;
};

export async function getDoctorOverview(): Promise<DoctorOverview> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  const doctor = await getMyDoctor();
  if (!doctor) {
    return {
      doctor: null,
      displayName: user?.profile.full_name ?? null,
      today: [],
      pendingReviews: 0,
      patientCount: 0,
    };
  }

  const [today, { count: pending }, { count: patients }] = await Promise.all([
    getDoctorAppointments(doctor.id, "today"),
    supabase
      .from("predictions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_review")
      .is("deleted_at", null),
    supabase.from("patients").select("id", { count: "exact", head: true }).is("deleted_at", null),
  ]);

  return {
    doctor,
    displayName: user?.profile.full_name ?? null,
    today,
    pendingReviews: pending ?? 0,
    patientCount: patients ?? 0,
  };
}
