import {
  LayoutDashboard,
  Stethoscope,
  CalendarDays,
  Users,
  Activity,
  Building2,
  ClipboardList,
  BriefcaseMedical,
  UserCog,
  BarChart3,
  ScrollText,
  Settings,
  ListChecks,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types";

export type NavItem = {
  /** Message key under `nav.*` */
  labelKey: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  patient: [
    { labelKey: "patient.dashboard", href: "/patient", icon: LayoutDashboard },
    { labelKey: "patient.symptomCheck", href: "/patient/symptom-check", icon: Activity },
    { labelKey: "patient.appointments", href: "/patient/appointments", icon: CalendarDays },
    { labelKey: "patient.records", href: "/patient/records", icon: FolderOpen },
    { labelKey: "patient.screenings", href: "/patient/screenings", icon: ClipboardList },
    { labelKey: "patient.profile", href: "/patient/profile", icon: UserCog },
  ],
  doctor: [
    { labelKey: "doctor.dashboard", href: "/doctor", icon: LayoutDashboard },
    { labelKey: "doctor.schedule", href: "/doctor/schedule", icon: CalendarDays },
    { labelKey: "doctor.patients", href: "/doctor/patients", icon: Users },
    { labelKey: "doctor.reviews", href: "/doctor/reviews", icon: Stethoscope },
    { labelKey: "doctor.settings", href: "/doctor/settings", icon: Settings },
  ],
  receptionist: [
    { labelKey: "reception.dashboard", href: "/reception", icon: LayoutDashboard },
    { labelKey: "reception.queue", href: "/reception/queue", icon: ListChecks },
    { labelKey: "reception.appointments", href: "/reception/appointments", icon: CalendarDays },
    { labelKey: "reception.patients", href: "/reception/patients", icon: Users },
    { labelKey: "reception.settings", href: "/reception/settings", icon: Settings },
  ],
  hospital_admin: [
    { labelKey: "admin.dashboard", href: "/admin", icon: LayoutDashboard },
    { labelKey: "admin.doctors", href: "/admin/doctors", icon: BriefcaseMedical },
    { labelKey: "admin.staff", href: "/admin/staff", icon: UserCog },
    { labelKey: "admin.departments", href: "/admin/departments", icon: Building2 },
    { labelKey: "admin.appointments", href: "/admin/appointments", icon: CalendarDays },
    { labelKey: "admin.analytics", href: "/admin/analytics", icon: BarChart3 },
    { labelKey: "admin.settings", href: "/admin/settings", icon: Settings },
  ],
  super_admin: [
    { labelKey: "platform.dashboard", href: "/platform", icon: LayoutDashboard },
    { labelKey: "platform.hospitals", href: "/platform/hospitals", icon: Building2 },
    { labelKey: "platform.doctors", href: "/platform/doctors", icon: BriefcaseMedical },
    { labelKey: "platform.specialties", href: "/platform/specialties", icon: Stethoscope },
    { labelKey: "platform.analytics", href: "/platform/analytics", icon: BarChart3 },
    { labelKey: "platform.audit", href: "/platform/audit", icon: ScrollText },
    { labelKey: "platform.settings", href: "/platform/settings", icon: Settings },
  ],
};
