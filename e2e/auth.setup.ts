import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import { ACCOUNTS, AUTH_DIR, DEMO_PASSWORD, stateFile, type Role } from "./constants";

setup.beforeAll(() => {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
});

const roles = Object.keys(ACCOUNTS) as Role[];

for (const role of roles) {
  setup(`authenticate ${role}`, async ({ page }) => {
    const { email, home } = ACCOUNTS[role];
    await page.goto("/login");
    await page.fill("#email", email);
    await page.fill("#password", DEMO_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait until we land on the role's dashboard (server action redirect).
    await page.waitForURL(`**${home}**`, { timeout: 30_000 });
    await expect(page).toHaveURL(new RegExp(home.replace("/", "\\/")));

    await page.context().storageState({ path: stateFile(role) });
  });
}
