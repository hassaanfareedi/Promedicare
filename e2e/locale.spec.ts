import { test, expect } from "@playwright/test";

test.describe("locale smoke", () => {
  test("default landing is English LTR", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("switching to Urdu sets RTL and persists after refresh", async ({ page, context }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "اردو", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "ur");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/سائن ان|خوش آمدید/);

    const cookies = await context.cookies();
    expect(cookies.some((c) => c.name === "NEXT_LOCALE" && c.value === "ur")).toBeTruthy();

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "ur");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("patient booking page loads under Urdu cookie", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "NEXT_LOCALE",
        value: "ur",
        domain: "localhost",
        path: "/",
      },
    ]);
    // Unauthenticated users are redirected to login — assert locale still applies.
    await page.goto("/patient/appointments/new");
    await expect(page.locator("html")).toHaveAttribute("lang", "ur");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
});
