import { test, expect } from "@playwright/test";
import { stateFile } from "./constants";

test.use({ storageState: stateFile("admin") });

test.describe("Hospital admin portal", () => {
  test("dashboard loads", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("departments page shows the seeded department", async ({ page }) => {
    await page.goto("/admin/departments");
    await expect(page.getByRole("heading", { name: /departments/i })).toBeVisible();
    await expect(page.getByText(/cardiology/i).first()).toBeVisible();
  });

  test("doctors page shows the seeded doctor", async ({ page }) => {
    await page.goto("/admin/doctors");
    await expect(page.getByRole("heading", { name: /doctors/i })).toBeVisible();
    await expect(page.getByText(/Dua Rahman/i).first()).toBeVisible();
  });

  test("staff page loads", async ({ page }) => {
    await page.goto("/admin/staff");
    await expect(page.getByRole("heading", { name: /staff/i })).toBeVisible();
  });

  test("appointments page loads", async ({ page }) => {
    await page.goto("/admin/appointments");
    await expect(page.getByRole("heading", { name: /appointments/i })).toBeVisible();
  });

  test("analytics page renders charts", async ({ page }) => {
    await page.goto("/admin/analytics");
    await expect(page.getByRole("heading", { name: /analytics/i })).toBeVisible();
  });
});
