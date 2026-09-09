import { describe, it, expect, vi } from "vitest";

vi.mock("@/server/db", async () => {
  const { createTestDb } = await import("@/server/db/test-db");
  return { db: createTestDb() };
});

import { db } from "@/server/db";
import { stocks, suppliers } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import {
  cancelPurchase,
  createPurchase,
  getPurchase,
  getPurchaseStats,
  listPurchases,
  receivePurchase,
} from "./purchase.service";
import {
  createProduct,
  createStock,
  createSupplier,
  createUser,
  createWarehouse,
} from "@/server/db/factories";
import { hashPassword } from "@/lib/auth/password";

async function seedPurchaseScenario() {
  const user = await createUser(db, {
    username: `pur_${Math.random().toString(36).slice(2, 8)}`,
    passwordHash: await hashPassword("secret123"),
  });
  const supplier = await createSupplier(db, { name: "مورد اختبار" });
  const warehouse = await createWarehouse(db, {
    id: "wh_main",
    code: "WH-MAIN",
    name: "المستودع الرئيسي",
  }).catch(() => null);
  const whId = warehouse?.id ?? "wh_main";
  const product = await createProduct(db, { buyPrice: 10, retailPrice: 15 });
  await createStock(db, product.id, whId, 20).catch(() => null);
  return { user, supplier, warehouseId: whId, product };
}

async function stockQty(productId: string, warehouseId: string) {
  const rows = await db
    .select({ quantity: stocks.quantity })
    .from(stocks)
    .where(and(eq(stocks.productId, productId), eq(stocks.warehouseId, warehouseId)));
  return rows[0]?.quantity ?? 0;
}

describe("purchase service", () => {
  it("creates a purchase order and updates supplier balance", async () => {
    const { user, supplier, product } = await seedPurchaseScenario();
    const beforeRow = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, supplier.id));
    const balanceBefore = beforeRow[0]?.balance ?? 0;
    const result = await createPurchase({
      supplierId: supplier.id,
      items: [{ productId: product.id, quantity: 5, unitCost: 10 }],
      userId: user.id,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.orderNumber).toBeGreaterThanOrEqual(1);
    expect(result.total).toBe(50);
    const after = await db.select().from(suppliers).where(eq(suppliers.id, supplier.id));
    expect(after[0]?.balance).toBe(balanceBefore + 50);
  });

  it("rejects empty items and invalid supplier", async () => {
    const { user, product } = await seedPurchaseScenario();
    const empty = await createPurchase({ supplierId: "x", items: [], userId: user.id });
    expect(empty.ok).toBe(false);
    const badSupplier = await createPurchase({
      supplierId: "nope",
      items: [{ productId: product.id, quantity: 1, unitCost: 5 }],
      userId: user.id,
    });
    expect(badSupplier.ok).toBe(false);
  });

  it("receives stock partially then fully and flips status", async () => {
    const { user, supplier, warehouseId, product } = await seedPurchaseScenario();
    const created = await createPurchase({
      supplierId: supplier.id,
      items: [{ productId: product.id, quantity: 10, unitCost: 8 }],
      userId: user.id,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const detail = await getPurchase(created.id);
    expect(detail).not.toBeNull();
    const itemId = detail!.items[0].id;
    const before = await stockQty(product.id, warehouseId);

    const part = await receivePurchase({ items: [{ itemId, quantity: 4 }] }, user.id);
    expect(part.ok).toBe(true);
    expect(await stockQty(product.id, warehouseId)).toBe(before + 4);
    const mid = await getPurchase(created.id);
    expect(mid!.status).toBe("submitted");
    expect(mid!.items[0].receivedQuantity).toBe(4);

    const rest = await receivePurchase({ items: [{ itemId, quantity: 6 }] }, user.id);
    expect(rest.ok).toBe(true);
    expect(await stockQty(product.id, warehouseId)).toBe(before + 10);
    const done = await getPurchase(created.id);
    expect(done!.status).toBe("received");
  });

  it("clamps over-receiving to ordered quantity", async () => {
    const { user, supplier, warehouseId, product } = await seedPurchaseScenario();
    const created = await createPurchase({
      supplierId: supplier.id,
      items: [{ productId: product.id, quantity: 3, unitCost: 8 }],
      userId: user.id,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const detail = await getPurchase(created.id);
    const itemId = detail!.items[0].id;
    const before = await stockQty(product.id, warehouseId);
    const res = await receivePurchase({ items: [{ itemId, quantity: 99 }] }, user.id);
    expect(res.ok).toBe(true);
    expect(await stockQty(product.id, warehouseId)).toBe(before + 3);
  });

  it("cancels a submitted order but not a received one", async () => {
    const { user, supplier, product } = await seedPurchaseScenario();
    const created = await createPurchase({
      supplierId: supplier.id,
      items: [{ productId: product.id, quantity: 2, unitCost: 8 }],
      userId: user.id,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect((await cancelPurchase(created.id, user.id)).ok).toBe(true);
    expect((await getPurchase(created.id))!.status).toBe("cancelled");

    const created2 = await createPurchase({
      supplierId: supplier.id,
      items: [{ productId: product.id, quantity: 2, unitCost: 8 }],
      userId: user.id,
    });
    expect(created2.ok).toBe(true);
    if (!created2.ok) return;
    const d2 = await getPurchase(created2.id);
    await receivePurchase({ items: [{ itemId: d2!.items[0].id, quantity: 2 }] }, user.id);
    expect((await cancelPurchase(created2.id, user.id)).ok).toBe(false);
  });

  it("lists purchases and computes stats", async () => {
    const { user, supplier, product } = await seedPurchaseScenario();
    await createPurchase({
      supplierId: supplier.id,
      items: [{ productId: product.id, quantity: 1, unitCost: 7 }],
      userId: user.id,
    });
    const list = await listPurchases();
    expect(list.length).toBeGreaterThanOrEqual(1);
    const stats = await getPurchaseStats();
    expect(stats.totalCount).toBeGreaterThanOrEqual(1);
    expect(stats.totalValue).toBeGreaterThanOrEqual(7);
  });
});
