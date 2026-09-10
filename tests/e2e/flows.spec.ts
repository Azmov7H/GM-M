import { test, expect } from "@playwright/test";

/**
 * Full-stack workflows through HTTP (server, auth, RBAC, services, DB).
 * Same scratch-database workflow as auth.spec.ts.
 */

test.describe("purchasing flow", () => {
  test("create PO, receive it, stock increases", async ({ request }) => {
    const login = await request.post("/api/auth/login", {
      data: { username: "admin", password: "admin123" },
    });
    expect(login.ok()).toBe(true);

    const before = await request.get("/api/stock/prod_rice");
    expect(before.ok()).toBe(true);
    const beforeRows = (
      (await before.json()) as {
        stock: { warehouseId: string; quantity: number }[];
      }
    ).stock;
    const beforeQty = beforeRows.find((r) => r.warehouseId === "wh_main")?.quantity ?? 0;

    const suppliersRes = await request.get("/api/suppliers");
    expect(suppliersRes.ok()).toBe(true);
    const { suppliers } = (await suppliersRes.json()) as {
      suppliers: { id: string }[];
    };
    expect(suppliers.length).toBeGreaterThan(0);

    const created = await request.post("/api/purchases", {
      data: {
        supplierId: suppliers[0].id,
        items: [{ productId: "prod_rice", quantity: 5, unitCost: 30 }],
      },
    });
    expect(created.status()).toBe(201);
    const { id } = (await created.json()) as { id: string };

    const detail = (await (await request.get(`/api/purchases/${id}`)).json()) as {
      purchase: { items: { id: string }[] };
    };
    const received = await request.post(`/api/purchases/${id}`, {
      data: { items: [{ itemId: detail.purchase.items[0].id, quantity: 5 }] },
    });
    expect(received.ok()).toBe(true);

    const after = await request.get("/api/stock/prod_rice");
    expect(after.ok()).toBe(true);
    const afterRows = (
      (await after.json()) as {
        stock: { warehouseId: string; quantity: number }[];
      }
    ).stock;
    const afterQty = afterRows.find((r) => r.warehouseId === "wh_main")?.quantity ?? 0;
    expect(afterQty).toBe(beforeQty + 5);
  });
});

test.describe("backup flow", () => {
  test("create, list, and download a backup", async ({ request }) => {
    const login = await request.post("/api/auth/login", {
      data: { username: "admin", password: "admin123" },
    });
    expect(login.ok()).toBe(true);

    // Creation is rate-limited (3/hour); fall back to the newest backup
    // when a previous suite run already consumed the quota.
    let filename: string;
    let size: number;
    const created = await request.post("/api/backup/create");
    if (created.status() === 201) {
      ({
        backup: { filename, size },
      } = (await created.json()) as {
        backup: { filename: string; size: number };
      });
      expect(size).toBeGreaterThan(0);
    } else {
      expect(created.status()).toBe(429);
      const listed = await request.get("/api/backup/list");
      const { backups } = (await listed.json()) as {
        backups: { filename: string; size: number }[];
      };
      expect(backups.length).toBeGreaterThan(0);
      ({ filename, size } = backups[0]);
    }

    const listed = await request.get("/api/backup/list");
    const { backups } = (await listed.json()) as { backups: { filename: string }[] };
    expect(backups.map((b) => b.filename)).toContain(filename);

    const dl = await request.get(`/api/backup/${filename}`);
    expect(dl.ok()).toBe(true);
    expect(Number(dl.headers()["content-length"])).toBe(size);
  });

  test("restore requires explicit confirmation", async ({ request }) => {
    await request.post("/api/auth/login", {
      data: { username: "admin", password: "admin123" },
    });
    const res = await request.post("/api/backup/restore", {
      data: { filename: "app-20000101-000000.db" },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe("rbac enforcement", () => {
  test("cashier cannot create purchases or backups", async ({ request }) => {
    await request.post("/api/auth/login", {
      data: { username: "admin", password: "admin123" },
    });
    const suffix = Date.now().toString(36);
    const mk = await request.post("/api/users", {
      data: {
        username: `e2e_cashier_${suffix}`,
        password: "Cash12345!",
        displayName: "كاشير",
        roleIds: ["role_cashier"],
      },
    });
    expect(mk.status()).toBe(201);

    await request.post("/api/auth/logout");
    const cashLogin = await request.post("/api/auth/login", {
      data: { username: `e2e_cashier_${suffix}`, password: "Cash12345!" },
    });
    expect(cashLogin.ok()).toBe(true);

    expect((await request.post("/api/purchases", { data: {} })).status()).toBe(403);
    expect((await request.post("/api/backup/create")).status()).toBe(403);
    expect((await request.get("/api/products")).status()).toBe(200);
  });
});
