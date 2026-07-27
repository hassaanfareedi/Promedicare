import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { dayBoundsInTimeZone, zonedDateParts } from "@/lib/datetime";
import { logDbError } from "@/lib/supabase/log";
import type {
  AppointmentStatus,
  Department,
  DoctorAvailability,
  Hospital,
  Profile,
  RiskLevel,
  Specialty,
} from "@/types";

/** Hospital linked to the signed-in hospital admin. */
export async function getMyHospital(): Promise<Hospital | null> {
  const user = await getCurrentUser();
  const hid = user?.profile.hospital_id;
  if (!hid) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hospitals")
    .select("*")
    .eq("id", hid)
    .is("deleted_at", null)
    .maybeSingle();
  logDbError("getMyHospital", error);
  return data;
}

export type AdminDoctor = {
  id: string;
  profile_id: string;
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
  const user = await getCurrentUser();
  const hid = user?.profile.hospital_id;
  if (!hid) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("hospital_id", hid)
    .is("deleted_at", null)
    .order("name");
  logDbError("getDepartments", error);
  return data ?? [];
}

export async function getSpecialties(): Promise<Specialty[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("specialties").select("*").order("name");
  logDbError("getSpecialties", error);
  return data ?? [];
}

const STAFF_ROLES = ["doctor", "receptionist", "hospital_admin"] as const;

export type AdminStaffMember = Profile & {
  hasDoctorProfile: boolean;
};

/** Hospital staff profiles only (excludes patients). Scoped to the admin's hospital. */
export async function getStaff(): Promise<AdminStaffMember[]> {
  const user = await getCurrentUser();
  const hid = user?.profile.hospital_id;
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("*")
    .in("role", [...STAFF_ROLES])
    .is("deleted_at", null)
    .order("full_name")
    .limit(500);

  if (user?.profile.role !== "super_admin") {
    if (!hid) return [];
    query = query.eq("hospital_id", hid);
  }

  const { data, error } = await query;
  logDbError("getStaff", error);
  const profiles = data ?? [];
  if (profiles.length === 0) return [];

  const profileIds = profiles.map((p) => p.id);
  const { data: doctorRows, error: doctorErr } = await supabase
    .from("doctors")
    .select("profile_id")
    .in("profile_id", profileIds)
    .is("deleted_at", null);
  logDbError("getStaff.doctors", doctorErr);

  const withClinical = new Set((doctorRows ?? []).map((d) => d.profile_id));
  return profiles.map((p) => ({
    ...p,
    hasDoctorProfile: withClinical.has(p.id),
  }));
}

/** Patient accounts that can be promoted into hospital staff. */
export async function getPromotableProfiles(): Promise<Profile[]> {
  const user = await getCurrentUser();
  const hid = user?.profile.hospital_id;
  const supabase = await createClient();

  // Patients link to a hospital through the `patients` table; their
  // `profiles.hospital_id` is typically null. Resolve hospital membership via
  // patients first so real patient accounts actually show up for promotion.
  if (user?.profile.role !== "super_admin") {
    if (!hid) return [];
    const { data: patientRows, error: patientsError } = await supabase
      .from("patients")
      .select("profile_id")
      .eq("hospital_id", hid)
      .not("profile_id", "is", null)
      .is("deleted_at", null);
    if (patientsError) {
      console.error("[getPromotableProfiles] patients", patientsError.message);
      return [];
    }
    const profileIds = [
      ...new Set(
        (patientRows ?? [])
          .map((r) => r.profile_id)
          .filter((v): v is string => Boolean(v)),
      ),
    ];
    if (profileIds.length === 0) return [];
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "patient")
      .in("id", profileIds)
      .is("deleted_at", null)
      .order("full_name")
      .limit(100);
    if (error) {
      console.error("[getPromotableProfiles] profiles", error.message);
      return [];
    }
    return data ?? [];
  }

  // Super admin: any patient account across the platform.
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "patient")
    .is("deleted_at", null)
    .order("full_name")
    .limit(100);
  if (error) {
    console.error("[getPromotableProfiles]", error.message);
    return [];
  }
  return data ?? [];
}

export async function getDoctorsAdmin(): Promise<AdminDoctor[]> {
  const user = await getCurrentUser();
  const hid = user?.profile.hospital_id;
  const supabase = await createClient();
  let query = supabase
    .from("doctors")
    .select(
      "id, profile_id, is_active, license_number, years_experience, consultation_fee, profile:profiles(id, full_name, email), specialty:specialties(id, name), department:departments(id, name), availability:doctor_availability(*)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Defense in depth: hospital admins (and other non–super-admins) only see their hospital.
  if (user?.profile.role !== "super_admin") {
    if (!hid) return [];
    query = query.eq("hospital_id", hid);
  }

  const { data, error } = await query;
  logDbError("getDoctorsAdmin", error);

  const rows = (data ?? []) as AdminDoctor[];
  const missingIds = [
    ...new Set(rows.filter((d) => !d.profile).map((d) => d.profile_id).filter(Boolean)),
  ];
  if (missingIds.length === 0) return rows;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return rows;
  }

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", missingIds);

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return rows.map((d) => {
    if (d.profile) return d;
    const p = byId.get(d.profile_id);
    if (!p) return d;
    return { ...d, profile: { id: p.id, full_name: p.full_name, email: p.email } };
  });
}

const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "checked_in",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
];

export type AdminOverview = {
  doctors: number;
  staff: number;
  departments: number;
  patients: number;
  appointmentsToday: number;
  todayByStatus: { status: AppointmentStatus; count: number }[];
  pendingRequests: number;
  confirmedUpcoming: number;
};

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = await createClient();
  const hospital = await getMyHospital();
  const timeZone = hospital?.timezone?.trim() || "Asia/Karachi";
  const { startIso, endIso } = dayBoundsInTimeZone(timeZone);
  const nowIso = new Date().toISOString();

  const [doctors, staff, departments, patients, todayRows, pending, confirmed] = await Promise.all([
    supabase.from("doctors").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("role", [...STAFF_ROLES])
      .is("deleted_at", null),
    supabase
      .from("departments")
      .select("id", { count: "exact", head: true })
      .eq("hospital_id", hospital?.id ?? "")
      .is("deleted_at", null),
    supabase.from("patients").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase
      .from("appointments")
      .select("status")
      .is("deleted_at", null)
      .gte("scheduled_start", startIso)
      .lte("scheduled_start", endIso),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .is("deleted_at", null),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed")
      .is("deleted_at", null)
      .gte("scheduled_start", nowIso),
  ]);

  logDbError("getAdminOverview.doctors", doctors.error);
  logDbError("getAdminOverview.staff", staff.error);
  logDbError("getAdminOverview.departments", departments.error);
  logDbError("getAdminOverview.patients", patients.error);
  logDbError("getAdminOverview.today", todayRows.error);
  logDbError("getAdminOverview.pending", pending.error);
  logDbError("getAdminOverview.confirmed", confirmed.error);

  const statusMap = new Map<AppointmentStatus, number>();
  for (const row of todayRows.data ?? []) {
    statusMap.set(row.status, (statusMap.get(row.status) ?? 0) + 1);
  }
  const todayByStatus = APPOINTMENT_STATUSES.map((status) => ({
    status,
    count: statusMap.get(status) ?? 0,
  }));
  const appointmentsToday = todayByStatus.reduce((sum, s) => sum + s.count, 0);

  return {
    doctors: doctors.count ?? 0,
    staff: staff.count ?? 0,
    departments: departments.count ?? 0,
    patients: patients.count ?? 0,
    appointmentsToday,
    todayByStatus,
    pendingRequests: pending.count ?? 0,
    confirmedUpcoming: confirmed.count ?? 0,
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

  // Align day bucketing with the dashboard, which uses the hospital timezone.
  const hospital = await getMyHospital();
  const timeZone = hospital?.timezone?.trim() || "Asia/Karachi";
  const zonedKey = (date: Date): string => {
    const { year, month, day } = zonedDateParts(timeZone, date);
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  // Today's start as the UTC instant of hospital-local midnight.
  const today = new Date(dayBoundsInTimeZone(timeZone).startIso);
  const weekEnd = new Date(today.getTime() + 7 * 86_400_000);
  const lookbackStart = new Date(today.getTime() - 6 * 86_400_000);

  // Counts are grouped in Postgres; trends read only the bounded date windows.
  const [statusRes, riskRes, trendRes, paymentsRes] = await Promise.all([
    supabase.rpc("appointment_status_counts"),
    supabase.rpc("prediction_risk_counts"),
    supabase
      .from("appointments")
      .select("scheduled_start")
      .is("deleted_at", null)
      .gte("scheduled_start", today.toISOString())
      .lt("scheduled_start", weekEnd.toISOString()),
    supabase
      .from("appointment_payments")
      .select("amount, collected_at")
      .gte("collected_at", lookbackStart.toISOString()),
  ]);
  logDbError("getAdminAnalytics.status", statusRes.error);
  logDbError("getAdminAnalytics.risk", riskRes.error);
  logDbError("getAdminAnalytics.trend", trendRes.error);
  logDbError("getAdminAnalytics.payments", paymentsRes.error);
  const { data: statusRows } = statusRes;
  const { data: riskRows } = riskRes;
  const { data: trendAppts } = trendRes;
  const { data: payments } = paymentsRes;

  const statusMap = new Map<AppointmentStatus, number>();
  let totalAppointments = 0;
  for (const s of statusRows ?? []) {
    statusMap.set(s.status, s.count);
    totalAppointments += s.count;
  }

  const trendMap = new Map<string, number>();
  for (const a of trendAppts ?? []) {
    const key = zonedKey(new Date(a.scheduled_start));
    trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
  }

  const riskMap = new Map<RiskLevel, number>();
  for (const r of riskRows ?? []) riskMap.set(r.risk_level, r.count);

  const weeklyTrend: { date: string; count: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const key = zonedKey(new Date(today.getTime() + i * 86_400_000));
    weeklyTrend.push({ date: key, count: trendMap.get(key) ?? 0 });
  }

  // All-time income is aggregated in Postgres; the trend uses the bounded rows.
  const { data: incomeRows, error: incomeErr } = await supabase.rpc("payment_income_by_hospital");
  logDbError("getAdminAnalytics.income", incomeErr);
  const totalIncome = (incomeRows ?? []).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const incomeMap = new Map<string, number>();
  for (const p of payments ?? []) {
    const amount = Number(p.amount) || 0;
    const d = new Date(p.collected_at);
    if (d >= lookbackStart && d < weekEnd) {
      const key = zonedKey(d);
      incomeMap.set(key, (incomeMap.get(key) ?? 0) + amount);
    }
  }

  const incomeTrend: { date: string; amount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const key = zonedKey(new Date(today.getTime() - i * 86_400_000));
    incomeTrend.push({ date: key, amount: incomeMap.get(key) ?? 0 });
  }

  return {
    totalAppointments,
    statusCounts: [...statusMap.entries()].map(([status, count]) => ({ status, count })),
    riskCounts: [...riskMap.entries()].map(([level, count]) => ({ level, count })),
    weeklyTrend,
    totalIncome,
    incomeTrend,
  };
}
