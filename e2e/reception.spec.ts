import { test, expect } from "@playwright/test";
import { stateFile } from "./constants";

test.use({ storageState: stateFile("reception") });

test.describe("Receptionist portal", () => {
  test("dashboard loads", async ({ page }) => {
    await page.goto("/reception");
    await expect(page).toHaveURL(/\/reception$/);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("queue page loads", async ({ page }) => {
    await page.goto("/reception/queue");
    await expect(page.getByRole("heading", { name: /queue/i, level: 1 })).toBeVisible();
  });

  test("appointments page loads", async ({ page }) => {
    await page.goto("/reception/appointments");
    await expect(page.getByRole("heading", { name: /appointments/i })).toBeVisible();
  });

  test("patients page loads and walk-in registration opens", async ({ page }) => {
    await page.goto("/reception/patients");
    await expect(page.getByRole("heading", { name: /patients/i })).toBeVisible();
    const walkIn = page.getByRole("button", { name: /walk.?in/i }).first();
    await expect(walkIn).toBeVisible();
    await walkIn.click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
