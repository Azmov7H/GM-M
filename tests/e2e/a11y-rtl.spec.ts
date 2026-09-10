import { test, expect } from "@playwright/test";

import { uiLogin } from "./helpers";

/**
 * Accessibility + RTL verification across major pages.
 * Same scratch-database workflow as auth.spec.ts.
 */

const PAGES = [
  "/",
  "/sales/pos",
  "/sales/invoices",
  "/inventory/products",
  "/inventory/stock",
  "/parties/customers",
  "/reports/sales",
  "/system/settings",
];

test.describe("rtl layout", () => {
  test.beforeEach(async ({ page }) => {
    await uiLogin(page);
  });

  for (const url of PAGES) {
    test(`${url} renders RTL Arabic without page errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.goto(url, { waitUntil: "load", timeout: 60000 });
      await page.waitForTimeout(2500);
      expect(await page.evaluate(() => document.documentElement.lang)).toBe("ar");
      expect(await page.evaluate(() => document.documentElement.dir)).toBe("rtl");
      // Exactly one top-level heading per page.
      expect(await page.getByRole("heading", { level: 1 }).count()).toBe(1);
      expect(errors).toEqual([]);
    });
  }
});

test.describe("accessibility basics", () => {
  test.beforeEach(async ({ page }) => {
    await uiLogin(page);
  });

  test("form controls have accessible names", async ({ page }) => {
    await page.goto("/sales/pos", { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(2000);
    const unnamed = await page.evaluate(() => {
      const bad: string[] = [];
      document.querySelectorAll("input, select, textarea").forEach((el) => {
        const htmlEl = el as HTMLElement;
        // Skip base-ui internal visually-hidden form inputs: their combobox
        // trigger carries the accessible name via an associated <label>.
        if (htmlEl.style.clipPath.includes("inset(50%)")) return;
        const labelled =
          el.getAttribute("aria-label") ||
          (el.id && document.querySelector(`label[for="${el.id}"]`)) ||
          el.closest("label");
        if (!labelled) bad.push(el.outerHTML.slice(0, 80));
      });
      return bad;
    });
    expect(unnamed).toEqual([]);
  });

  test("icon-only buttons expose labels", async ({ page }) => {
    await page.goto("/inventory/products", { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(2000);
    const unlabeled = await page.evaluate(() => {
      let count = 0;
      document.querySelectorAll("button").forEach((b) => {
        const text = (b.textContent ?? "").trim();
        if (!text && !b.getAttribute("aria-label")) count += 1;
      });
      return count;
    });
    expect(unlabeled).toBe(0);
  });

  test("keyboard can reach the POS search field", async ({ page }) => {
    await page.goto("/sales/pos", { waitUntil: "load", timeout: 60000 });
    const search = page.getByLabel(/بحث عن صنف/);
    await expect(search).toBeVisible({ timeout: 15000 });
    // Poll: the shortcut listener attaches on hydration, shortly after HTML.
    await expect
      .poll(
        async () => {
          await page.keyboard.press("F2");
          return await search.evaluate((el) => el === document.activeElement);
        },
        { timeout: 10000 },
      )
      .toBe(true);
  });

  test("login form announces errors to assistive tech", async ({ page }) => {
    await page.request.post("/api/auth/logout");
    await page.goto("/login");
    await page.getByLabel("اسم المستخدم").fill("admin");
    await page.getByLabel("كلمة المرور").fill("wrong");
    await page.getByRole("button", { name: "تسجيل الدخول" }).click();
    // The form-level error (not an empty live region) must carry the message.
    await expect(page.getByRole("alert").filter({ hasText: "غير صحيحة" })).toBeVisible({
      timeout: 15000,
    });
  });
});
