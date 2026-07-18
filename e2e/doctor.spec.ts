import { test, expect } from "@playwright/test";
import { stateFile } from "./constants";

test.use({ storageState: stateFile("doctor") });

test.describe("Doctor portal", () => {
  test("dashboard loads", async ({ page }) => {
    await page.goto("/doctor");
    await expect(page).toHaveURL(/\/doctor$/);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("schedule page loads", async ({ page }) => {
    await page.goto("/doctor/schedule");
    await expect(page.getByRole("heading", { name: /schedule/i })).toBeVisible();
  });

  test("patients page loads", async ({ page }) => {
    await page.goto("/doctor/patients");
    await expect(page.getByRole("heading", { name: /patients/i })).toBeVisible();
  });

  test("AI reviews page shows the pending screening", async ({ page }) => {
    await page.goto("/doctor/reviews");
    await expect(page.getByRole("heading", { name: /reviews/i })).toBeVisible();
    // The seeded prediction is pending review and should be actionable.
    await expect(page.getByRole("button", { name: /review/i }).first()).toBeVisible();
  });
});
