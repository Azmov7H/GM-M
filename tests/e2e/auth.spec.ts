import { test, expect } from "@playwright/test";

import { uiLogin } from "./helpers";

/**
 * Auth workflow against a scratch database.
 * Run: DATABASE_URL=/tmp/e2e/app.db BACKUP_DIR=/tmp/e2e/backups \
 *   SESSION_SECRET=e2e-secret-32bytes-minimum-please \
 *   PORT=3223 BASE_URL=http://localhost:3223 \
 *   npm run db:seed && (npm run start -- -p 3223 &) && npx playwright test
 * Seed provides admin / admin123 (owner).
 */

test.describe("authentication", () => {
  test("login page is RTL Arabic", async ({ page }) => {
    await page.goto("/login");
    expect(await page.evaluate(() => document.documentElement.lang)).toBe("ar");
    expect(await page.evaluate(() => document.documentElement.dir)).toBe("rtl");
    await expect(page.getByLabel("اسم المستخدم")).toBeVisible();
    await expect(page.getByLabel("كلمة المرور")).toBeVisible();
  });

  test("wrong password shows an error and stays on login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("اسم المستخدم").fill("admin");
    await page.getByLabel("كلمة المرور").fill("wrong-password");
    await page.getByRole("button", { name: /دخول|تسجيل الدخول/ }).click();
    await expect(page.getByRole("alert").filter({ hasText: "غير صحيحة" })).toBeVisible({
      timeout: 15000,
    });
    expect(page.url()).toContain("/login");
  });

  test("login lands on the dashboard with KPIs", async ({ page }) => {
    await uiLogin(page);
    await expect(page.getByRole("heading", { name: "لوحة التحكم" })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("مبيعات اليوم")).toBeVisible();
  });

  test("protected API without session returns 401", async ({ request }) => {
    const res = await request.get("/api/products");
    expect(res.status()).toBe(401);
  });

  test("protected page without session redirects to login", async ({ page }) => {
    await page.goto("/sales/pos");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("logout returns to login", async ({ page }) => {
    await uiLogin(page);
    await page.getByRole("button", { name: "تسجيل الخروج" }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
});
