import type { RiskLevel, UserRole, AppointmentStatus } from "@/types";

export const APP_NAME = "ProMediCare AI";

export const AI_DISCLAIMER =
  "ProMediCare AI provides decision support only and is not a medical diagnosis. It does not replace consultation with a licensed medical professional. In an emergency, contact your local emergency services immediately.";

/** Landing route for each authenticated role after login. */
export const ROLE_HOME: Record<UserRole, string> = {
  patient: "/patient",
  doctor: "/doctor",
  receptionist: "/reception",
  hospital_admin: "/admin",
  super_admin: "/platform",
};

/** Account / settings page for each role. */
export const ROLE_SETTINGS: Record<UserRole, string> = {
  patient: "/patient/profile",
  doctor: "/doctor/settings",
  receptionist: "/reception/settings",
  hospital_admin: "/admin/settings",
  super_admin: "/platform/settings",
};

/** Path prefix each role is allowed to access (enforced in middleware + layouts). */
export const ROLE_PREFIX: Record<UserRole, string> = {
  patient: "/patient",
  doctor: "/doctor",
  receptionist: "/reception",
  hospital_admin: "/admin",
  super_admin: "/platform",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  patient: "Patient",
  doctor: "Doctor",
  receptionist: "Receptionist",
  hospital_admin: "Hospital Admin",
  super_admin: "Super Admin",
};

export const RISK_META: Record<
  RiskLevel,
  { label: string; description: string; tone: string }
> = {
  low: {
    label: "Low",
    description: "Symptoms suggest a low likelihood of a serious condition.",
    tone: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
  },
  medium: {
    label: "Medium",
    description: "Consider a consultation with the recommended specialist.",
    tone: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  },
  high: {
    label: "High",
    description: "A prompt consultation with a specialist is advised.",
    tone: "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900",
  },
  urgent: {
    label: "Urgent",
    description: "Seek medical attention as soon as possible.",
    tone: "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
  },
};

export const APPOINTMENT_STATUS_META: Record<
  AppointmentStatus,
  { label: string; tone: string }
> = {
  pending: { label: "Pending", tone: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300" },
  confirmed: { label: "Confirmed", tone: "bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300" },
  checked_in: { label: "Checked in", tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" },
  in_progress: { label: "In progress", tone: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300" },
  completed: { label: "Completed", tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" },
  cancelled: { label: "Cancelled", tone: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300" },
  no_show: { label: "No show", tone: "bg-muted text-muted-foreground" },
};
