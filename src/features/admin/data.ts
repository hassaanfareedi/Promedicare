import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AppointmentStatus, Department, DoctorAvailability, Profile, RiskLevel, Specialty } from "@/types";

export type AdminDoctor = {
  id: string;
  is_active: boolean;
  license_number: string | null;
  years_experience: number | null;
  consultation_fee: number | null;
  profile: Pick<Profile, "id" | "full_name" | "email"> | null;
  specialty: Pick<Specialty, "id" | "name"> | null;
  department: Pick<Department, "id" | "name"> | null;
  availability: DoctorAvailability[];
};

export async function getDepartments(): Promise<Department[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("departments")
    .select("*")
    .is("deleted_at", null)
    .order("name");
  return data ?? [];
}

export async function getSpecialties(): Promise<Specialty[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("specialties").select("*").order("name");
  return data ?? [];
}

/** All profiles within the admin's hospital (RLS-scoped). */
export async function getStaff(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .is("deleted_at", null)
    .order("full_name");
  return data ?? [];
}

export async function getDoctorsAdmin(): Promise<AdminDoctor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("doctors")
    .select(
      "id, is_active, license_number, years_experience, consultation_fee, profile:profiles(id, full_name, email), specialty:specialties(id, name), department:departments(id, name), availability:doctor_availability(*)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return (data ?? []) as AdminDoctor[];
}

export type AdminOverview = {
  doctors: number;
  staff: number;
  departments: number;
  patients: number;
  appointmentsToday: number;
};

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = await createClient();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const [doctors, staff, departments, patients, appts] = await Promise.all([
    supabase.from("doctors").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("profiles").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("departments").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("patients").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("scheduled_start", start.toISOString())
      .lte("scheduled_start", end.toISOString()),
  ]);

  return {
    doctors: doctors.count ?? 0,
    staff: staff.count ?? 0,
    departments: departments.count ?? 0,
    patients: patients.count ?? 0,
    appointmentsToday: appts.count ?? 0,
  };
}

export type AdminAnalytics = {
  totalAppointments: number;
  statusCounts: { status: AppointmentStatus; count: number }[];
  riskCounts: { level: RiskLevel; count: number }[];
  weeklyTrend: { date: string; count: number }[];
  totalIncome: number;
  incomeTrend: { date: string; amount: number }[];
};

/** Aggregated analytics for the admin's hospital (RLS-scoped). */
export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const supabase = await createClient();
  const [{ data: appts }, { data: preds }, { data: payments }] = await Promise.all([
    supabase.from("appointments").select("status, scheduled_start").is("deleted_at", null),
    supabase.from("predictions").select("risk_level").is("deleted_at", null),
    supabase.from("appointment_payments").select("amount, collected_at, currency"),
  ]);

  const statusMap = new Map<AppointmentStatus, number>();
  const trendMap = new Map<string, number>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const a of appts ?? []) {
    statusMap.set(a.status, (statusMap.get(a.status) ?? 0) + 1);
    const d = new Date(a.scheduled_start);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
    if (diff >= 0 && diff < 7) {
      const key = d.toISOString().slice(0, 10);
      trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
    }
  }

  const riskMap = new Map<RiskLevel, number>();
  for (const p of preds ?? []) {
    riskMap.set(p.risk_level, (riskMap.get(p.risk_level) ?? 0) + 1);
  }

  const weeklyTrend: { date: string; count: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today.getTime() + i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    weeklyTrend.push({ date: key, count: trendMap.get(key) ?? 0 });
  }

  const incomeMap = new Map<string, number>();
  let totalIncome = 0;
  const lookbackStart = new Date(today.getTime() - 6 * 86_400_000);
  for (const p of payments ?? []) {
    const amount = Number(p.amount) || 0;
    totalIncome += amount;
    const d = new Date(p.collected_at);
    d.setHours(0, 0, 0, 0);
    if (d >= lookbackStart && d <= today) {
      const key = d.toISOString().slice(0, 10);
      incomeMap.set(key, (incomeMap.get(key) ?? 0) + amount);
    }
  }

  const incomeTrend: { date: string; amount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    incomeTrend.push({ date: key, amount: incomeMap.get(key) ?? 0 });
  }

  return {
    totalAppointments: (appts ?? []).length,
    statusCounts: [...statusMap.entries()].map(([status, count]) => ({ status, count })),
    riskCounts: [...riskMap.entries()].map(([level, count]) => ({ level, count })),
    weeklyTrend,
    totalIncome,
    incomeTrend,
  };
}
