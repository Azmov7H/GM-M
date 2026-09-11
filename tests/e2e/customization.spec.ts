import { expect, test } from "@playwright/test";

import { uiLogin } from "./helpers";

/**
 * Run with a scratch database (see docs or Phase 13 notes):
 *   DATABASE_URL=/tmp/e2e-test/app.db BACKUP_DIR=/tmp/e2e-test/backups \
 *     SESSION_SECRET=e2e-secret-32bytes-minimum-please npm run db:migrate \
 *     && npm run db:seed
 *   DATABASE_URL=... npm run start -- -p 3223
 *   BASE_URL=http://localhost:3223 npx playwright test customization
 */

test.describe("company and invoice customization", () => {
  test("settings API round-trips company name with validation", async ({ request }) => {
    const login = await request.post("/api/auth/login", {
      data: { username: "admin", password: "admin123" },
    });
    expect(login.ok()).toBe(true);

    const before = await request.get("/api/settings");
    expect(before.ok()).toBe(true);

    const bad = await request.put("/api/settings", {
      data: { "invoice.template": "fancy" },
    });
    expect(bad.status()).toBe(422);

    const unknown = await request.put("/api/settings", {
      data: { "nope.key": "x" },
    });
    expect(unknown.status()).toBe(400);

    const ok = await request.put("/api/settings", {
      data: { "company.name": "شركة الاختبار", "company.phone": "0512345678" },
    });
    expect(ok.ok()).toBe(true);
    const { settings } = (await ok.json()) as {
      settings: Record<string, string>;
    };
    expect(settings["company.name"]).toBe("شركة الاختبار");

    // Restore default for other specs.
    await request.put("/api/settings", { data: { "company.name": "مؤسستي" } });
  });

  test("new pages render: returns, cashier, group redirects", async ({ page }) => {
    await uiLogin(page);

    await page.goto("/sales/returns");
    await expect(page.getByRole("heading", { name: "مرتجع المبيعات" })).toBeVisible();

    await page.goto("/finance/cashier");
    await expect(page.getByRole("heading", { name: "الخزينة" })).toBeVisible();
    await expect(page.getByText("النقد المتوقع في الدرج")).toBeVisible();

    await page.goto("/sales");
    await expect(page).toHaveURL(/\/sales\/pos/);
    await page.goto("/finance");
    await expect(page).toHaveURL(/\/finance\/cashier/);
  });

  test("invoice shows the customized company header", async ({ page, request }) => {
    const login = await request.post("/api/auth/login", {
      data: { username: "admin", password: "admin123" },
    });
    expect(login.ok()).toBe(true);
    await request.put("/api/settings", {
      data: { "company.name": "شركة الفاتورة" },
    });
    await uiLogin(page);

    await page.goto("/sales/invoices");
    const first = page.getByRole("link", { name: /#\d+/ }).first();
    if ((await first.count()) > 0) {
      await first.click();
      await expect(page.getByText("شركة الفاتورة").first()).toBeVisible();
    }

    await request.put("/api/settings", { data: { "company.name": "مؤسستي" } });
  });
});
