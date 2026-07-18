import { test, expect } from "@playwright/test";
import { stateFile } from "./constants";

test.use({ storageState: stateFile("patient") });

test.describe("Patient portal", () => {
  test("dashboard loads for the seeded patient", async ({ page }) => {
    await page.goto("/patient");
    await expect(page).toHaveURL(/\/patient$/);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("appointments page shows the seeded upcoming appointment", async ({ page }) => {
    await page.goto("/patient/appointments");
    await expect(page.getByRole("heading", { name: /appointments/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /upcoming/i })).toBeVisible();
    await expect(page.getByText(/Dr\. Dua Rahman/i)).toBeVisible();
  });

  test("screenings page shows the seeded screening", async ({ page }) => {
    await page.goto("/patient/screenings");
    await expect(page.getByRole("heading", { name: /screenings/i })).toBeVisible();
    await expect(page.getByText(/cardiology/i).first()).toBeVisible();
  });

  test("profile page loads and is editable", async ({ page }) => {
    await page.goto("/patient/profile");
    await expect(page.getByRole("heading", { name: /profile/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /save/i })).toBeVisible();
  });

  test("AI symptom screening runs end to end", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/patient/symptom-check");
    await expect(page.getByRole("heading", { name: /symptom check/i })).toBeVisible();

    await page.getByRole("button", { name: "Chest pain", exact: true }).click();
    await page.getByRole("button", { name: "Fatigue", exact: true }).click();
    await page.getByRole("button", { name: /run ai screening/i }).click();

    // Either a live AI result or the safe fallback renders the result view.
    await expect(page.getByRole("button", { name: /run another check/i })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/decision support only/i).first()).toBeVisible();
  });

  test("booking wizard starts at hospital selection", async ({ page }) => {
    await page.goto("/patient/appointments/new");
    await expect(page.getByRole("heading", { name: /book an appointment/i })).toBeVisible();
    // Step 1 lists the seeded hospital to choose from.
    await expect(page.getByText(/central care hospital/i).first()).toBeVisible();
  });
});
