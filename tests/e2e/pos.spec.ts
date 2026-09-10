import { test, expect } from "@playwright/test";

import { uiLogin } from "./helpers";

/**
 * Point-of-sale workflow against a scratch database (see auth.spec.ts).
 * Uses deterministic seed product P-0001 (أرز بسمتي 5 كجم, stocked).
 */

test.describe("point of sale", () => {
  test.beforeEach(async ({ page }) => {
    await uiLogin(page);
    await page.goto("/sales/pos");
    await expect(page.getByLabel(/بحث عن صنف/)).toBeVisible({ timeout: 15000 });
  });

  test("search, add to cart, and complete a cash sale", async ({ page }) => {
    await page.getByLabel(/بحث عن صنف/).fill("P-0001");
    const option = page.getByRole("option", { name: /أرز بسمتي/ });
    await expect(option).toBeVisible({ timeout: 15000 });
    await option.click();
    await expect(page.getByText("السلة (1)")).toBeVisible();

    await page.getByRole("button", { name: /إتمام البيع/ }).click();
    await expect(page.getByText(/تم إنشاء الفاتورة/)).toBeVisible({
      timeout: 15000,
    });
    // Cart clears after a completed sale.
    await expect(page.getByText("السلة (0)")).toBeVisible({ timeout: 15000 });
  });

  test("completed sale opens a detail page with its lines", async ({ page }) => {
    await page.getByLabel(/بحث عن صنف/).fill("P-0002");
    const option = page.getByRole("option", { name: /سكر/ });
    await expect(option).toBeVisible({ timeout: 15000 });
    await option.click();
    await page.getByRole("button", { name: /إتمام البيع/ }).click();
    const status = page.getByRole("status");
    await expect(status).toContainText(/تم إنشاء الفاتورة/, { timeout: 15000 });
    await status.getByRole("link", { name: "عرض الفاتورة" }).click();
    await expect(page).toHaveURL(/\/sales\/invoices\/.+/, { timeout: 15000 });
    await expect(page.getByText("P-0002")).toBeVisible({ timeout: 15000 });
  });

  test("empty cart cannot be submitted", async ({ page }) => {
    await expect(page.getByText("السلة فارغة")).toBeVisible();
    const submit = page.getByRole("button", { name: /إتمام البيع/ });
    await expect(submit).toBeDisabled();
  });
});
