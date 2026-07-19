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

    // Regression guard: clicking sidebar links must navigate client-side, even
    // after opening/closing the header account menu (a modal overlay that could
    // otherwise leave `pointer-events: none` on the body and deaden all clicks).
    test(`${role} sidebar links navigate on click`, async ({ page }) => {
      await page.goto(NAV[role].home);
      const nav = page.locator("nav").first();

      // Open then dismiss the account menu to exercise the overlay/pointer-events path.
      await page.getByRole("button", { name: /account menu/i }).click();
      await page.keyboard.press("Escape");

      // Every non-home link must be reachable by an actual click (not page.goto).
      for (const href of NAV[role].links.filter((h) => h !== NAV[role].home)) {
        await nav.locator(`a[href="${href}"]`).first().click();
        await expect(page).toHaveURL(new RegExp(`${href.replace(/\//g, "\\/")}$`));
        await expect(page.getByRole("main")).toBeVisible();
        await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
      }
    });
  });
}
