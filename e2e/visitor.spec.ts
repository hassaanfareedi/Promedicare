import { test, expect } from "@playwright/test";
import { VISITOR } from "./constants";

// Public, logged-out context.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Visitor / public", () => {
  test("homepage renders hero, primary CTAs and the lookup card", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/understand\s+your\s+symptoms/i);
    await expect(page.getByRole("link", { name: /get started/i }).first()).toBeVisible();
    await expect(page.getByText(/look up your record/i).first()).toBeVisible();
    // Marketing sections are present.
    await expect(page.getByRole("heading", { name: /how it works/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /everything in one platform/i })).toBeVisible();
  });

  test("dedicated records page loads", async ({ page }) => {
    await page.goto("/records");
    await expect(page.getByRole("heading", { name: /patient record lookup/i })).toBeVisible();
  });

  test("valid record lookup returns a minimal record", async ({ page }) => {
    await page.goto("/records");
    await page.getByPlaceholder("PMC-123456").fill(VISITOR.valid.code);
    await page.locator('input[type="date"]').fill(VISITOR.valid.dob);
    await page.getByRole("button", { name: /find my record/i }).click();

    await expect(page.getByText(/record found/i)).toBeVisible();
    await expect(page.getByText(VISITOR.valid.code)).toBeVisible();
    await expect(page.getByText(/next appointment/i)).toBeVisible();
    await expect(page.getByText(/recent history/i)).toBeVisible();
  });

  test("phone as the second factor also verifies", async ({ page }) => {
    await page.goto("/records");
    await page.getByPlaceholder("PMC-123456").fill(VISITOR.valid.code);
    await page.getByRole("tab", { name: /registered phone/i }).click();
    await page.locator('input[type="tel"]').fill(VISITOR.valid.phone);
    await page.getByRole("button", { name: /find my record/i }).click();
    await expect(page.getByText(/record found/i)).toBeVisible();
  });

  test("invalid lookup shows a generic error, never leaks data", async ({ page }) => {
    await page.goto("/records");
    await page.getByPlaceholder("PMC-123456").fill(VISITOR.invalid.code);
    await page.locator('input[type="date"]').fill(VISITOR.invalid.dob);
    await page.getByRole("button", { name: /find my record/i }).click();
    await expect(page.getByText(/couldn.t find a matching record/i)).toBeVisible();
  });

  test("protected routes redirect anonymous users to login", async ({ page }) => {
    await page.goto("/patient");
    await expect(page).toHaveURL(/\/login/);
  });
});
