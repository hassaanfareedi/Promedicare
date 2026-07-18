import { test, expect } from "@playwright/test";
import { stateFile, type Role } from "./constants";

const NAV: Record<Role, { home: string; links: string[] }> = {
  patient: {
    home: "/patient",
    links: [
      "/patient",
      "/patient/symptom-check",
      "/patient/appointments",
      "/patient/records",
      "/patient/screenings",
      "/patient/profile",
    ],
  },
  doctor: {
    home: "/doctor",
    links: [
      "/doctor",
      "/doctor/schedule",
      "/doctor/patients",
      "/doctor/reviews",
      "/doctor/settings",
    ],
  },
  reception: {
    home: "/reception",
    links: [
      "/reception",
      "/reception/queue",
      "/reception/appointments",
      "/reception/patients",
      "/reception/settings",
    ],
  },
  admin: {
    home: "/admin",
    links: [
      "/admin",
      "/admin/doctors",
      "/admin/staff",
      "/admin/departments",
      "/admin/appointments",
      "/admin/analytics",
      "/admin/settings",
    ],
  },
  superadmin: {
    home: "/platform",
    links: ["/platform", "/platform/hospitals", "/platform/specialties", "/platform/analytics", "/platform/audit", "/platform/settings"],
  },
};

for (const role of Object.keys(NAV) as Role[]) {
  test.describe(`smoke: ${role}`, () => {
    test.use({ storageState: stateFile(role) });

    test(`every ${role} route renders without an error boundary`, async ({ page }) => {
      for (const href of NAV[role].links) {
        await page.goto(href);
        await expect(page).toHaveURL(new RegExp(`${href.replace(/\//g, "\\/")}$`));
        await expect(page.getByRole("main")).toBeVisible();
        // The global error boundary must not be showing.
        await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
      }
    });

    test(`${role} sidebar exposes all nav links`, async ({ page }) => {
      await page.goto(NAV[role].home);
      const nav = page.locator("nav").first();
      for (const href of NAV[role].links) {
        await expect(nav.locator(`a[href="${href}"]`).first()).toBeVisible();
      }
    });
  });
}
