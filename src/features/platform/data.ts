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
    .order("full_name")
    .limit(500);
  return data ?? [];
}

export type PlatformDoctor = {
  id: string;
  is_active: boolean;
  hospital_id: string;
  hospital_name: string | null;
  specialty_name: string | null;
  profile: Pick<Profile, "id" | "full_name" | "email"> | null;
};

export async function getPlatformDoctors(): Promise<PlatformDoctor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("doctors")
    .select(
      "id, is_active, hospital_id, profile:profiles(id, full_name, email), specialty:specialties(name), hospital:hospitals(name)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => {
    const r = row as {
      id: string;
      is_active: boolean;
      hospital_id: string;
      profile: PlatformDoctor["profile"];
      specialty: { name: string } | null;
      hospital: { name: string } | null;
    };
    return {
      id: r.id,
      is_active: r.is_active,
      hospital_id: r.hospital_id,
      hospital_name: r.hospital?.name ?? null,
      specialty_name: r.specialty?.name ?? null,
      profile: r.profile,
    };
  });
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
  // Grouping happens in Postgres (see 0022); we only fetch the small result sets.
  const [{ data: hospitals }, { data: apptRows }, { data: riskRows }, { data: roleRows }, { data: incomeRows }] =
    await Promise.all([
      supabase.from("hospitals").select("id, name"),
      supabase.rpc("appointments_count_by_hospital"),
      supabase.rpc("prediction_risk_counts"),
      supabase.rpc("profile_role_counts"),
      supabase.rpc("payment_income_by_hospital"),
    ]);

  const nameMap = new Map((hospitals ?? []).map((h) => [h.id, h.name]));
  const perHospitalMap = new Map<string, number>();
  for (const a of apptRows ?? []) {
    const name = nameMap.get(a.hospital_id) ?? "Unknown";
    perHospitalMap.set(name, (perHospitalMap.get(name) ?? 0) + a.count);
  }

  const riskMap = new Map<RiskLevel, number>();
  for (const r of riskRows ?? []) riskMap.set(r.risk_level, r.count);

  const roleMap = new Map<UserRole, number>();
  for (const r of roleRows ?? []) roleMap.set(r.role, r.count);

  const incomeMap = new Map<string, number>();
  let totalIncome = 0;
  for (const r of incomeRows ?? []) {
    const amount = Number(r.amount) || 0;
    totalIncome += amount;
    const name = nameMap.get(r.hospital_id) ?? "Unknown";
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
