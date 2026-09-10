import { test, expect } from "@playwright/test";

import { uiLogin } from "./helpers";

/**
 * Smoke: unauthenticated visitors reach the login page,
 * and unknown routes show the localized not-found page.
 * (Scratch-database workflow documented in auth.spec.ts.)
 */

test("visitors are sent to login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  await expect(page.getByLabel("اسم المستخدم")).toBeVisible();
});

test("unknown route renders not-found", async ({ page }) => {
  await uiLogin(page);
  await page.goto("/no-such-page-anywhere");
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible({
    timeout: 15000,
  });
});
