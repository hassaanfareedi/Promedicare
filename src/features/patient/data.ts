import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import type { Appointment, Patient, Prediction } from "@/types";

export type AppointmentView = Appointment & {
  doctorName: string | null;
  specialtyName: string | null;
  departmentName: string | null;
  hospitalName: string | null;
};

/** The signed-in user's own patient record, if onboarding is complete. */
export async function getMyPatient(): Promise<Patient | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("patients")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();
  return data;
}

/** Enriches appointment rows with doctor / specialty / department / hospital names. */
async function enrichAppointments(
  rows: Appointment[],
  opts: { includeHospitalDept?: boolean } = {},
): Promise<AppointmentView[]> {
  if (rows.length === 0) return [];
  const supabase = await createClient();
  const includeHospitalDept = opts.includeHospitalDept ?? true;

  const doctorIds = [...new Set(rows.map((r) => r.doctor_id).filter((v): v is string => Boolean(v)))];
  const hospitalIds = includeHospitalDept
    ? [...new Set(rows.map((r) => r.hospital_id))]
    : [];
  const departmentIds = includeHospitalDept
    ? [...new Set(rows.map((r) => r.department_id).filter((v): v is string => Boolean(v)))]
    : [];

  const [{ data: doctors }, { data: hospitals }, { data: departments }] = await Promise.all([
    doctorIds.length
      ? supabase.from("doctor_directory").select("id, full_name, specialty_name").in("id", doctorIds)
      : Promise.resolve({ data: [] as { id: string | null; full_name: string | null; specialty_name: string | null }[] }),
    hospitalIds.length
      ? supabase.from("hospitals").select("id, name").in("id", hospitalIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    departmentIds.length
      ? supabase.from("departments").select("id, name").in("id", departmentIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const doctorMap = new Map((doctors ?? []).map((d) => [d.id, d]));
  const hospitalMap = new Map((hospitals ?? []).map((h) => [h.id, h.name]));
  const deptMap = new Map((departments ?? []).map((d) => [d.id, d.name]));

  return rows.map((r) => {
    const doc = r.doctor_id ? doctorMap.get(r.doctor_id) : null;
    return {
      ...r,
      doctorName: doc?.full_name ?? null,
      specialtyName: doc?.specialty_name ?? null,
      departmentName: r.department_id ? deptMap.get(r.department_id) ?? null : null,
      hospitalName: hospitalMap.get(r.hospital_id) ?? null,
    };
  });
}

/** All of the patient's appointments, most recent first. */
export async function getMyAppointments(): Promise<AppointmentView[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select("*")
    .is("deleted_at", null)
    .order("scheduled_start", { ascending: false });
  return enrichAppointments(data ?? []);
}

/** The patient's screening history (AI predictions). */
export async function getMyScreenings(): Promise<Prediction[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("predictions")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export type OverviewScreening = Pick<
  Prediction,
  "id" | "recommended_specialty_label" | "risk_level" | "created_at"
>;

export type PatientOverview = {
  displayName: string | null;
  upcoming: AppointmentView[];
  recentScreenings: OverviewScreening[];
  stats: { totalAppointments: number; upcomingCount: number; screeningCount: number };
};

const OVERVIEW_APPT_COLUMNS =
  "id, hospital_id, patient_id, doctor_id, department_id, status, scheduled_start, scheduled_end, reason, source, created_at, updated_at, deleted_at, notes, prediction_id, queue_number, checked_in_at, checked_out_at, cancelled_at, cancelled_reason, created_by" as const;

/** Aggregated data for the patient dashboard. */
export async function getPatientOverview(): Promise<PatientOverview> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  const nowIso = new Date().toISOString();

  const [apptsRes, screeningsRes, apptCountRes, screenCountRes] = await Promise.all([
    supabase
      .from("appointments")
      .select(OVERVIEW_APPT_COLUMNS)
      .is("deleted_at", null)
      .gte("scheduled_start", nowIso)
      .in("status", ["pending", "confirmed", "checked_in", "in_progress"])
      .order("scheduled_start", { ascending: true })
      .limit(5),
    supabase
      .from("predictions")
      .select("id, recommended_specialty_label, risk_level, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase.from("appointments").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("predictions").select("id", { count: "exact", head: true }).is("deleted_at", null),
  ]);

  const appts = apptsRes.data;
  const screenings = screeningsRes.data;
  const apptCount = apptCountRes.count;
  const screenCount = screenCountRes.count;

  const upcoming = await enrichAppointments((appts ?? []) as Appointment[], {
    includeHospitalDept: false,
  });

  return {
    displayName: user?.profile.full_name ?? null,
    upcoming,
    recentScreenings: screenings ?? [],
    stats: {
      totalAppointments: apptCount ?? 0,
      upcomingCount: upcoming.length,
      screeningCount: screenCount ?? 0,
    },
  };
}
