// Records a smooth product-tour video (webm) for the README.
//
// Prereqs: app served at http://localhost:3000 and demo data seeded, plus the
// patient storage state from `npx playwright test --project=setup`.
//
// Run: node scripts/record-demo.mjs
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const SIZE = { width: 1280, height: 800 };
const TMP = path.join("public", "tmp-video");
const OUT = path.join("public", "demo.webm");
const STATE = path.join("e2e", ".auth", "patient.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function smoothScrollTo(page, selector) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, selector);
  await sleep(1800);
}

async function main() {
  fs.mkdirSync(TMP, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: SIZE,
    storageState: fs.existsSync(STATE) ? STATE : undefined,
    recordVideo: { dir: TMP, size: SIZE },
    baseURL: BASE,
  });
  const page = await context.newPage();

  // 1) Marketing homepage --------------------------------------------------
  await page.goto("/");
  await sleep(2200); // let the preloader play out
  await smoothScrollTo(page, "#how");
  await smoothScrollTo(page, "#features");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(1400);

  // 2) Public record lookup -------------------------------------------------
  await page.goto("/records");
  await sleep(900);
  await page.getByPlaceholder("PMC-123456").click();
  await page.getByPlaceholder("PMC-123456").type("PMC-200001", { delay: 60 });
  await page.locator('input[type="date"]').fill("1990-05-14");
  await sleep(500);
  await page.getByRole("button", { name: /find my record/i }).click();
  await page.getByText(/record found/i).waitFor({ timeout: 15000 }).catch(() => {});
  await sleep(2600);

  // 3) Patient dashboard ----------------------------------------------------
  await page.goto("/patient");
  await sleep(1800);

  // 4) AI symptom screening -------------------------------------------------
  await page.goto("/patient/symptom-check");
  await sleep(1000);
  for (const s of ["Chest pain", "Fatigue", "Shortness of breath"]) {
    await page.getByRole("button", { name: s, exact: true }).click();
    await sleep(450);
  }
  await page.getByRole("button", { name: /run ai screening/i }).click();
  await page.getByRole("button", { name: /run another check/i }).waitFor({ timeout: 60000 }).catch(() => {});
  await sleep(1200);
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
  await sleep(2600);

  // 5) Screenings + appointments -------------------------------------------
  await page.goto("/patient/screenings");
  await sleep(2200);
  await page.goto("/patient/appointments");
  await sleep(2400);

  await context.close();
  await browser.close();

  // Move the recorded file to public/demo.webm
  const files = fs.readdirSync(TMP).filter((f) => f.endsWith(".webm"));
  if (files.length === 0) {
    console.error("No video was recorded.");
    process.exit(1);
  }
  const newest = files
    .map((f) => ({ f, t: fs.statSync(path.join(TMP, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)[0].f;
  fs.copyFileSync(path.join(TMP, newest), OUT);
  fs.rmSync(TMP, { recursive: true, force: true });
  const kb = Math.round(fs.statSync(OUT).size / 1024);
  console.log(`\u2713 Demo video saved to ${OUT} (${kb} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
