import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Appointment, Patient } from "@/types";

export type StaffAppointment = Appointment & {
  patientName: string | null;
  patientCode: string | null;
  doctorName: string | null;
  specialtyName: string | null;
  consultationFee: number | null;
};

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

async function enrich(rows: Appointment[]): Promise<StaffAppointment[]> {
  if (rows.length === 0) return [];
  const supabase = await createClient();
  const patientIds = [...new Set(rows.map((r) => r.patient_id))];
  const doctorIds = [...new Set(rows.map((r) => r.doctor_id).filter((v): v is string => Boolean(v)))];

  const [{ data: patients }, { data: doctors }] = await Promise.all([
    supabase.from("patients").select("id, full_name, patient_code").in("id", patientIds),
    doctorIds.length
      ? supabase
          .from("doctor_directory")
          .select("id, full_name, specialty_name, consultation_fee")
          .in("id", doctorIds)
      : Promise.resolve({
          data: [] as {
            id: string | null;
            full_name: string | null;
            specialty_name: string | null;
            consultation_fee: number | null;
          }[],
        }),
  ]);

  const pMap = new Map((patients ?? []).map((p) => [p.id, p]));
  const dMap = new Map((doctors ?? []).map((d) => [d.id, d]));

  return rows.map((r) => {
    const p = pMap.get(r.patient_id);
    const d = r.doctor_id ? dMap.get(r.doctor_id) : null;
    return {
      ...r,
      patientName: p?.full_name ?? null,
      patientCode: p?.patient_code ?? null,
      doctorName: d?.full_name ?? null,
      specialtyName: d?.specialty_name ?? null,
      consultationFee: d?.consultation_fee ?? null,
    };
  });
}

/** Columns used by front-desk lists and status controls (avoids select *). */
const STAFF_APPT_COLUMNS =
  "id, hospital_id, patient_id, doctor_id, status, scheduled_start, scheduled_end, reason, source, queue_number" as const;

/** Today's appointments across the receptionist's hospital (RLS-scoped). */
export async function getTodayAppointments(): Promise<StaffAppointment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select(STAFF_APPT_COLUMNS)
    .is("deleted_at", null)
    .gte("scheduled_start", startOfToday())
    .lte("scheduled_start", endOfToday())
    .order("scheduled_start", { ascending: true });
  return enrich((data ?? []) as Appointment[]);
}

/** All hospital appointments (RLS-scoped), most recent first. */
export async function getHospitalAppointments(): Promise<StaffAppointment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select(STAFF_APPT_COLUMNS)
    .is("deleted_at", null)
    .order("scheduled_start", { ascending: false })
    .limit(200);
  return enrich((data ?? []) as Appointment[]);
}

/** Pending booking requests (hospital-scoped), soonest first. */
export async function getPendingHospitalAppointments(limit = 5): Promise<StaffAppointment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select(STAFF_APPT_COLUMNS)
    .eq("status", "pending")
    .is("deleted_at", null)
    .order("scheduled_start", { ascending: true })
    .limit(limit);
  return enrich((data ?? []) as Appointment[]);
}

/** Confirmed upcoming appointments (hospital-scoped), soonest first. */
export async function getConfirmedUpcomingAppointments(limit = 5): Promise<StaffAppointment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select(STAFF_APPT_COLUMNS)
    .eq("status", "confirmed")
    .is("deleted_at", null)
    .gte("scheduled_start", new Date().toISOString())
    .order("scheduled_start", { ascending: true })
    .limit(limit);
  return enrich((data ?? []) as Appointment[]);
}

/** Count of pending appointment requests (hospital-scoped via RLS). */
export async function getPendingAppointmentRequestCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .is("deleted_at", null);
  return count ?? 0;
}

/** Pending-first sort for staff appointment lists. */
export function sortAppointmentsPendingFirst(rows: StaffAppointment[]): StaffAppointment[] {
  return [...rows].sort((a, b) => {
    const aPending = a.status === "pending" ? 0 : 1;
    const bPending = b.status === "pending" ? 0 : 1;
    if (aPending !== bPending) return aPending - bPending;
    return new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime();
  });
}

/** Patients in the receptionist's hospital (RLS-scoped). */
export async function getHospitalPatients(): Promise<Patient[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("patients")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  return data ?? [];
}

export type ReceptionOverview = {
  today: StaffAppointment[];
  waiting: number;
  patientCount: number;
};

export async function getReceptionOverview(): Promise<ReceptionOverview> {
  const supabase = await createClient();
  const [today, { count: patients }] = await Promise.all([
    getTodayAppointments(),
    supabase.from("patients").select("id", { count: "exact", head: true }).is("deleted_at", null),
  ]);

  const waiting = today.filter((a) => a.status === "checked_in").length;
  return { today, waiting, patientCount: patients ?? 0 };
}
