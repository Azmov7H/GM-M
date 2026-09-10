import type { Page } from "@playwright/test";

/**
 * Shared E2E helpers (scratch database workflow documented in auth.spec.ts).
 * Seed provides admin / admin123 (owner).
 */
export async function uiLogin(page: Page, username = "admin", password = "admin123") {
  await page.goto("/login");
  await page.getByLabel("اسم المستخدم").fill(username);
  await page.getByLabel("كلمة المرور").fill(password);
  await page.getByRole("button", { name: /دخول|تسجيل الدخول/ }).click();
  await page.waitForURL("/", { timeout: 30000 });
}
