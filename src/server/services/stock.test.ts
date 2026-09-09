import { describe, it, expect, vi } from "vitest";

vi.mock("@/server/db", async () => {
  const { createTestDb } = await import("@/server/db/test-db");
  return { db: createTestDb() };
});

import { db } from "@/server/db";
import { stocks } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import {
  adjustStock,
  getProductStock,
  getStockLevels,
  listMovements,
  transferStock,
} from "./stock.service";
import {
  createProduct,
  createStock,
  createUser,
  createWarehouse,
} from "@/server/db/factories";
import { hashPassword } from "@/lib/auth/password";

async function seedStockScenario() {
  const user = await createUser(db, {
    username: `wh_${Math.random().toString(36).slice(2, 8)}`,
    passwordHash: await hashPassword("secret123"),
  });
  const from = await createWarehouse(db, {
    code: `F-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
  });
  const to = await createWarehouse(db, {
    code: `T-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
  });
  const product = await createProduct(db, { buyPrice: 5, retailPrice: 8 });
  await createStock(db, product.id, from.id, 100);
  return { user, from, to, product };
}

async function stockQty(productId: string, warehouseId: string) {
  const rows = await db
    .select({ quantity: stocks.quantity })
    .from(stocks)
    .where(and(eq(stocks.productId, productId), eq(stocks.warehouseId, warehouseId)));
  return rows[0]?.quantity ?? 0;
}

describe("stock service", () => {
  it("transfers stock atomically and logs movements", async () => {
    const { user, from, to, product } = await seedStockScenario();
    const result = await transferStock({
      productId: product.id,
      fromWarehouseId: from.id,
      toWarehouseId: to.id,
      quantity: 30,
      userId: user.id,
    });
    expect(result.ok).toBe(true);

    expect(await stockQty(product.id, from.id)).toBe(70);
    expect(await stockQty(product.id, to.id)).toBe(30);

    const movements = await listMovements({ productId: product.id });
    const transfers = movements.filter((m) => m.type === "TRANSFER");
    expect(transfers.length).toBe(2);
    expect(transfers.map((m) => m.quantity).sort((a, b) => a - b)).toEqual([-30, 30]);
  });

  it("rejects transfers with insufficient stock without side effects", async () => {
    const { user, from, to, product } = await seedStockScenario();
    const before = await listMovements({ productId: product.id });
    const result = await transferStock({
      productId: product.id,
      fromWarehouseId: from.id,
      toWarehouseId: to.id,
      quantity: 500,
      userId: user.id,
    });
    expect(result.ok).toBe(false);
    expect(await stockQty(product.id, from.id)).toBe(100);
    expect(await stockQty(product.id, to.id)).toBe(0);
    expect((await listMovements({ productId: product.id })).length).toBe(before.length);
  });

  it("rejects same-warehouse transfers", async () => {
    const { user, from, product } = await seedStockScenario();
    const result = await transferStock({
      productId: product.id,
      fromWarehouseId: from.id,
      toWarehouseId: from.id,
      quantity: 5,
      userId: user.id,
    });
    expect(result.ok).toBe(false);
  });

  it("adjusts stock and requires a reason", async () => {
    const { user, from, product } = await seedStockScenario();
    expect(
      (
        await adjustStock({
          productId: product.id,
          warehouseId: from.id,
          quantity: 42,
          reason: "",
          userId: user.id,
        })
      ).ok,
    ).toBe(false);
    expect(
      (
        await adjustStock({
          productId: product.id,
          warehouseId: from.id,
          quantity: -5,
          reason: "خطأ",
          userId: user.id,
        })
      ).ok,
    ).toBe(false);

    const result = await adjustStock({
      productId: product.id,
      warehouseId: from.id,
      quantity: 42,
      reason: "جرد ميداني",
      userId: user.id,
    });
    expect(result.ok).toBe(true);
    expect(await stockQty(product.id, from.id)).toBe(42);
    const movements = await listMovements({ productId: product.id, type: "ADJUST" });
    expect(movements.length).toBeGreaterThan(0);
    expect(movements[0].reason).toBe("جرد ميداني");
  });

  it("reports levels and per-product stock", async () => {
    const { from, product } = await seedStockScenario();
    const levels = await getStockLevels({});
    expect(levels.some((l) => l.productId === product.id)).toBe(true);
    const perProduct = await getProductStock(product.id);
    expect(perProduct.find((r) => r.warehouseId === from.id)?.quantity).toBe(100);
  });
});
