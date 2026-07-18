import path from "node:path";

export const DEMO_PASSWORD = "Promedicare#2026";

export type Role = "patient" | "doctor" | "reception" | "admin" | "superadmin";

/** Seeded demo accounts (see scripts/seed.mjs). */
export const ACCOUNTS: Record<Role, { email: string; home: string }> = {
  patient: { email: "patient@promedicare.test", home: "/patient" },
  doctor: { email: "doctor@promedicare.test", home: "/doctor" },
  reception: { email: "reception@promedicare.test", home: "/reception" },
  admin: { email: "admin@promedicare.test", home: "/admin" },
  superadmin: { email: "superadmin@promedicare.test", home: "/platform" },
};

export const AUTH_DIR = path.join(process.cwd(), "e2e", ".auth");

export function stateFile(role: Role): string {
  return path.join(AUTH_DIR, `${role}.json`);
}

/** Seeded patient records for the public visitor lookup. */
export const VISITOR = {
  valid: { code: "PMC-200001", dob: "1990-05-14", phone: "+15551230001" },
  second: { code: "PMC-200002", dob: "1978-11-02" },
  invalid: { code: "PMC-999999", dob: "2000-01-01" },
};
