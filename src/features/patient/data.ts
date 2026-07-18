import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Appointment, Patient, Prediction } from "@/types";

export type AppointmentView = Appointment & {
  doctorName: string | null;
  specialtyName: string | null;
  departmentName: string | null;
  hospitalName: string | null;
};

/** The signed-in user's own patient record, if onboarding is complete. */
export async function getMyPatient(): Promise<Patient | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("patients")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();
  return data;
}

/** Enriches appointment rows with doctor / specialty / department / hospital names. */
async function enrichAppointments(rows: Appointment[]): Promise<AppointmentView[]> {
  if (rows.length === 0) return [];
  const supabase = await createClient();

  const doctorIds = [...new Set(rows.map((r) => r.doctor_id).filter((v): v is string => Boolean(v)))];
  const hospitalIds = [...new Set(rows.map((r) => r.hospital_id))];
  const departmentIds = [...new Set(rows.map((r) => r.department_id).filter((v): v is string => Boolean(v)))];

  const [{ data: doctors }, { data: hospitals }, { data: departments }] = await Promise.all([
    doctorIds.length
      ? supabase.from("doctor_directory").select("id, full_name, specialty_name").in("id", doctorIds)
      : Promise.resolve({ data: [] as { id: string | null; full_name: string | null; specialty_name: string | null }[] }),
    supabase.from("hospitals").select("id, name").in("id", hospitalIds),
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

export type PatientOverview = {
  patient: Patient | null;
  upcoming: AppointmentView[];
  recentScreenings: Prediction[];
  stats: { totalAppointments: number; upcomingCount: number; screeningCount: number };
};

/** Aggregated data for the patient dashboard. */
export async function getPatientOverview(): Promise<PatientOverview> {
  const supabase = await createClient();
  const patient = await getMyPatient();

  const nowIso = new Date().toISOString();
  const [{ data: appts }, { data: screenings }, { count: apptCount }, { count: screenCount }] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("*")
        .is("deleted_at", null)
        .gte("scheduled_start", nowIso)
        .in("status", ["pending", "confirmed", "checked_in", "in_progress"])
        .order("scheduled_start", { ascending: true })
        .limit(5),
      supabase
        .from("predictions")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase.from("appointments").select("id", { count: "exact", head: true }).is("deleted_at", null),
      supabase.from("predictions").select("id", { count: "exact", head: true }).is("deleted_at", null),
    ]);

  const upcoming = await enrichAppointments(appts ?? []);
  return {
    patient,
    upcoming,
    recentScreenings: screenings ?? [],
    stats: {
      totalAppointments: apptCount ?? 0,
      upcomingCount: upcoming.length,
      screeningCount: screenCount ?? 0,
    },
  };
}
