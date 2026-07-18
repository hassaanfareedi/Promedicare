import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Hospital, Profile, Specialty, RiskLevel, UserRole } from "@/types";

export type AuditEntry = {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  actor: Pick<Profile, "full_name" | "email"> | null;
};

export async function getHospitals(): Promise<Hospital[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("hospitals").select("*").order("name");
  return data ?? [];
}

export async function getAllSpecialties(): Promise<Specialty[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("specialties").select("*").order("name");
  return data ?? [];
}

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .is("deleted_at", null)
    .order("full_name");
  return data ?? [];
}

export async function getAuditLogs(limit = 100): Promise<AuditEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, created_at, actor:profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as AuditEntry[];
}

export type PlatformOverview = {
  hospitals: number;
  users: number;
  doctors: number;
  patients: number;
  appointments: number;
  predictions: number;
};

export async function getPlatformOverview(): Promise<PlatformOverview> {
  const supabase = await createClient();
  const head = { count: "exact" as const, head: true };
  const [hospitals, users, doctors, patients, appointments, predictions] = await Promise.all([
    supabase.from("hospitals").select("id", head).is("deleted_at", null),
    supabase.from("profiles").select("id", head).is("deleted_at", null),
    supabase.from("doctors").select("id", head).is("deleted_at", null),
    supabase.from("patients").select("id", head).is("deleted_at", null),
    supabase.from("appointments").select("id", head).is("deleted_at", null),
    supabase.from("predictions").select("id", head).is("deleted_at", null),
  ]);
  return {
    hospitals: hospitals.count ?? 0,
    users: users.count ?? 0,
    doctors: doctors.count ?? 0,
    patients: patients.count ?? 0,
    appointments: appointments.count ?? 0,
    predictions: predictions.count ?? 0,
  };
}

export type PlatformAnalytics = {
  perHospital: { hospital: string; count: number }[];
  riskCounts: { level: RiskLevel; count: number }[];
  roleCounts: { role: UserRole; count: number }[];
  totalIncome: number;
  incomeByHospital: { hospital: string; amount: number }[];
};

export async function getPlatformAnalytics(): Promise<PlatformAnalytics> {
  const supabase = await createClient();
  const [{ data: hospitals }, { data: appts }, { data: preds }, { data: profiles }, { data: payments }] =
    await Promise.all([
      supabase.from("hospitals").select("id, name"),
      supabase.from("appointments").select("hospital_id").is("deleted_at", null),
      supabase.from("predictions").select("risk_level").is("deleted_at", null),
      supabase.from("profiles").select("role").is("deleted_at", null),
      supabase.from("appointment_payments").select("hospital_id, amount"),
    ]);

  const nameMap = new Map((hospitals ?? []).map((h) => [h.id, h.name]));
  const perHospitalMap = new Map<string, number>();
  for (const a of appts ?? []) {
    const name = nameMap.get(a.hospital_id) ?? "Unknown";
    perHospitalMap.set(name, (perHospitalMap.get(name) ?? 0) + 1);
  }

  const riskMap = new Map<RiskLevel, number>();
  for (const p of preds ?? []) riskMap.set(p.risk_level, (riskMap.get(p.risk_level) ?? 0) + 1);

  const roleMap = new Map<UserRole, number>();
  for (const p of profiles ?? []) roleMap.set(p.role, (roleMap.get(p.role) ?? 0) + 1);

  const incomeMap = new Map<string, number>();
  let totalIncome = 0;
  for (const p of payments ?? []) {
    const amount = Number(p.amount) || 0;
    totalIncome += amount;
    const name = nameMap.get(p.hospital_id) ?? "Unknown";
    incomeMap.set(name, (incomeMap.get(name) ?? 0) + amount);
  }

  return {
    perHospital: [...perHospitalMap.entries()].map(([hospital, count]) => ({ hospital, count })),
    riskCounts: [...riskMap.entries()].map(([level, count]) => ({ level, count })),
    roleCounts: [...roleMap.entries()].map(([role, count]) => ({ role, count })),
    totalIncome,
    incomeByHospital: [...incomeMap.entries()].map(([hospital, amount]) => ({ hospital, amount })),
  };
}
