import type { Database, Tables, Enums } from "@/types/database";

export type { Database };

export type UserRole = Enums<"user_role">;
export type AppointmentStatus = Enums<"appointment_status">;
export type AppointmentSource = Enums<"appointment_source">;
export type RiskLevel = Enums<"risk_level">;
export type PredictionStatus = Enums<"prediction_status">;
export type Gender = Enums<"gender">;
export type NotificationType = Enums<"notification_type">;

export type Profile = Tables<"profiles">;
export type Hospital = Tables<"hospitals">;
export type Department = Tables<"departments">;
export type Specialty = Tables<"specialties">;
export type Doctor = Tables<"doctors">;
export type Patient = Tables<"patients">;
export type DoctorAvailability = Tables<"doctor_availability">;
export type Prediction = Tables<"predictions">;
export type Appointment = Tables<"appointments">;
export type ConsultationNote = Tables<"consultation_notes">;
export type Notification = Tables<"notifications">;
export type AuditLog = Tables<"audit_logs">;

/** A single condition predicted by the AI screening layer. */
export type PredictedCondition = {
  condition: string;
  likelihood: number;
};

/** Minimal, non-sensitive record shape returned by the public visitor lookup. */
export type VisitorRecord = {
  patientCode: string;
  fullName: string;
  registeredHospital: string | null;
  nextAppointment: {
    date: string;
    status: AppointmentStatus;
    doctor: string | null;
    department: string | null;
  } | null;
  recentHistory: {
    date: string;
    status: AppointmentStatus;
    doctor: string | null;
  }[];
};

/** Doctor joined with its profile + specialty, used across booking and portals. */
export type DoctorWithRelations = Doctor & {
  profile: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
  specialty: Pick<Specialty, "id" | "name" | "slug"> | null;
  department: Pick<Department, "id" | "name"> | null;
};

export type AppointmentWithRelations = Appointment & {
  patient: Pick<Patient, "id" | "full_name" | "patient_code"> | null;
  doctor: (Pick<Doctor, "id"> & {
    profile: Pick<Profile, "full_name"> | null;
    specialty: Pick<Specialty, "name"> | null;
  }) | null;
  department: Pick<Department, "id" | "name"> | null;
};
