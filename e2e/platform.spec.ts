import { test, expect } from "@playwright/test";
import { stateFile } from "./constants";

test.use({ storageState: stateFile("superadmin") });

test.describe("Super admin platform portal", () => {
  test("dashboard loads", async ({ page }) => {
    await page.goto("/platform");
    await expect(page).toHaveURL(/\/platform$/);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("hospitals page shows seeded hospitals", async ({ page }) => {
    await page.goto("/platform/hospitals");
    await expect(page.getByRole("heading", { name: /hospitals/i })).toBeVisible();
    await expect(page.getByText(/central care hospital/i).first()).toBeVisible();
  });

  test("specialties page shows seeded specialties", async ({ page }) => {
    await page.goto("/platform/specialties");
    await expect(page.getByRole("heading", { name: /specialties/i })).toBeVisible();
    await expect(page.getByText(/cardiology/i).first()).toBeVisible();
  });

  test("analytics page renders", async ({ page }) => {
    await page.goto("/platform/analytics");
    await expect(page.getByRole("heading", { name: /platform analytics/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /export csv/i }).first()).toBeVisible();
  });

  test("audit logs page renders", async ({ page }) => {
    await page.goto("/platform/audit");
    await expect(page.getByRole("heading", { name: /audit logs/i })).toBeVisible();
  });

  test("settings page shows AI status", async ({ page }) => {
    await page.goto("/platform/settings");
    await expect(page.getByRole("heading", { name: /platform settings/i })).toBeVisible();
    await expect(page.getByText(/AI screening/i).first()).toBeVisible();
  });
});
