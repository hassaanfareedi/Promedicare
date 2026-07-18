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
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  patient: [
    { label: "Dashboard", href: "/patient", icon: LayoutDashboard },
    { label: "Symptom Check", href: "/patient/symptom-check", icon: Activity },
    { label: "Appointments", href: "/patient/appointments", icon: CalendarDays },
    { label: "Records", href: "/patient/records", icon: FolderOpen },
    { label: "Screenings", href: "/patient/screenings", icon: ClipboardList },
    { label: "Profile", href: "/patient/profile", icon: UserCog },
  ],
  doctor: [
    { label: "Dashboard", href: "/doctor", icon: LayoutDashboard },
    { label: "Schedule", href: "/doctor/schedule", icon: CalendarDays },
    { label: "Patients", href: "/doctor/patients", icon: Users },
    { label: "AI Reviews", href: "/doctor/reviews", icon: Stethoscope },
    { label: "Settings", href: "/doctor/settings", icon: Settings },
  ],
  receptionist: [
    { label: "Dashboard", href: "/reception", icon: LayoutDashboard },
    { label: "Queue", href: "/reception/queue", icon: ListChecks },
    { label: "Appointments", href: "/reception/appointments", icon: CalendarDays },
    { label: "Patients", href: "/reception/patients", icon: Users },
    { label: "Settings", href: "/reception/settings", icon: Settings },
  ],
  hospital_admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Doctors", href: "/admin/doctors", icon: BriefcaseMedical },
    { label: "Staff", href: "/admin/staff", icon: UserCog },
    { label: "Departments", href: "/admin/departments", icon: Building2 },
    { label: "Appointments", href: "/admin/appointments", icon: CalendarDays },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ],
  super_admin: [
    { label: "Dashboard", href: "/platform", icon: LayoutDashboard },
    { label: "Hospitals", href: "/platform/hospitals", icon: Building2 },
    { label: "Specialties", href: "/platform/specialties", icon: Stethoscope },
    { label: "Analytics", href: "/platform/analytics", icon: BarChart3 },
    { label: "Audit Logs", href: "/platform/audit", icon: ScrollText },
    { label: "Settings", href: "/platform/settings", icon: Settings },
  ],
};
