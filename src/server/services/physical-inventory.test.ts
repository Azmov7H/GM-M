import { describe, it, expect, vi } from "vitest";

vi.mock("@/server/db", async () => {
  const { createTestDb } = await import("@/server/db/test-db");
  return { db: createTestDb() };
});

import { db } from "@/server/db";
import { stocks } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import {
  approveCount,
  cancelCount,
  completeCount,
  createCount,
  getCount,
  updateCounts,
} from "./physical-inventory.service";
import {
  createProduct,
  createStock,
  createUser,
  createWarehouse,
} from "@/server/db/factories";
import { hashPassword } from "@/lib/auth/password";

async function seedCountScenario(qty = 50) {
  const user = await createUser(db, {
    username: `pi_${Math.random().toString(36).slice(2, 8)}`,
    passwordHash: await hashPassword("secret123"),
  });
  const warehouse = await createWarehouse(db, {
    code: `W-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
  });
  const product = await createProduct(db, { buyPrice: 5, retailPrice: 8 });
  await createStock(db, product.id, warehouse.id, qty);
  return { user, warehouse, product };
}

async function stockQty(productId: string, warehouseId: string) {
  const rows = await db
    .select({ quantity: stocks.quantity })
    .from(stocks)
    .where(and(eq(stocks.productId, productId), eq(stocks.warehouseId, warehouseId)));
  return rows[0]?.quantity ?? 0;
}

describe("physical inventory service", () => {
  it("creates a count with system snapshots and blocks concurrent sessions", async () => {
    const { user, warehouse } = await seedCountScenario();
    const first = await createCount({
      name: "جرد 1",
      warehouseId: warehouse.id,
      userId: user.id,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const detail = await getCount(first.id);
    expect(detail?.items.length).toBeGreaterThan(0);
    expect(detail?.items[0].systemQuantity).toBe(50);

    const second = await createCount({
      name: "جرد 2",
      warehouseId: warehouse.id,
      userId: user.id,
    });
    expect(second.ok).toBe(false);

    await cancelCount(first.id, user.id);
    const third = await createCount({
      name: "جرد 3",
      warehouseId: warehouse.id,
      userId: user.id,
    });
    expect(third.ok).toBe(true);
    if (third.ok) await cancelCount(third.id, user.id);
  });

  it("counts, completes, and approves variances into stock", async () => {
    const { user, warehouse, product } = await seedCountScenario(50);
    const created = await createCount({
      name: "جرد كامل",
      warehouseId: warehouse.id,
      userId: user.id,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect((await completeCount(created.id, user.id)).ok).toBe(false);

    const detail = await getCount(created.id);
    const updates = detail!.items.map((i) => ({ itemId: i.id, countedQuantity: 45 }));
    expect((await updateCounts(created.id, updates, user.id)).ok).toBe(true);

    const afterUpdate = await getCount(created.id);
    expect(afterUpdate?.items[0].variance).toBe(-5);

    expect((await completeCount(created.id, user.id)).ok).toBe(true);
    const approved = await approveCount(created.id, user.id);
    expect(approved.ok).toBe(true);
    expect(await stockQty(product.id, warehouse.id)).toBe(45);

    const final = await getCount(created.id);
    expect(final?.status).toBe("approved");
  });

  it("rejects approving a non-completed count", async () => {
    const { user, warehouse } = await seedCountScenario();
    const created = await createCount({
      name: "جرد مرفوض",
      warehouseId: warehouse.id,
      userId: user.id,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect((await approveCount(created.id, user.id)).ok).toBe(false);
    await cancelCount(created.id, user.id);
  });
});
