import { describe, it, expect, vi } from "vitest";

vi.mock("@/server/db", async () => {
  const { createTestDb } = await import("@/server/db/test-db");
  return { db: createTestDb() };
});

import { db } from "@/server/db";
import { stocks } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { cancelSale, processReturn } from "./sale-return.service";
import { createSale, getSale, getSalesStats, listSales } from "./sale.service";
import {
  createCustomer,
  createProduct,
  createStock,
  createUser,
  createWarehouse,
} from "@/server/db/factories";
import { hashPassword } from "@/lib/auth/password";

async function seedSaleScenario() {
  const user = await createUser(db, {
    username: `pos_${Math.random().toString(36).slice(2, 8)}`,
    passwordHash: await hashPassword("secret123"),
  });
  const warehouse = await createWarehouse(db, {
    code: `S-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
  });
  const product = await createProduct(db, { buyPrice: 10, retailPrice: 15 });
  await createStock(db, product.id, warehouse.id, 100);
  const customer = await createCustomer(db, { name: "عميل اختبار" });
  return { user, warehouse, product, customer };
}

async function stockQty(productId: string, warehouseId: string) {
  const rows = await db
    .select({ quantity: stocks.quantity })
    .from(stocks)
    .where(and(eq(stocks.productId, productId), eq(stocks.warehouseId, warehouseId)));
  return rows[0]?.quantity ?? 0;
}

describe("sale service", () => {
  it("creates a cash sale and deducts stock", async () => {
    const { user, warehouse, product } = await seedSaleScenario();
    const result = await createSale({
      items: [
        { productId: product.id, quantity: 4, unitPrice: 15, warehouseId: warehouse.id },
      ],
      paymentType: "cash",
      paidAmount: 60,
      userId: user.id,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.invoiceNumber).toBeGreaterThanOrEqual(1);
    expect(result.paymentStatus).toBe("paid");
    expect(await stockQty(product.id, warehouse.id)).toBe(96);

    const sale = await getSale(result.id);
    expect(sale?.items).toHaveLength(1);
    expect(sale?.items[0].productCode).toBe(product.code);
  });

  it("rejects sales exceeding available stock", async () => {
    const { user, warehouse, product } = await seedSaleScenario();
    const result = await createSale({
      items: [
        {
          productId: product.id,
          quantity: 500,
          unitPrice: 15,
          warehouseId: warehouse.id,
        },
      ],
      paymentType: "cash",
      paidAmount: 7500,
      userId: user.id,
    });
    expect(result.ok).toBe(false);
    expect(await stockQty(product.id, warehouse.id)).toBe(100);
  });

  it("supports service items without touching stock", async () => {
    const { user, warehouse } = await seedSaleScenario();
    const result = await createSale({
      items: [
        {
          productName: "توصيل",
          quantity: 1,
          unitPrice: 20,
          warehouseId: warehouse.id,
          isService: true,
        },
      ],
      paymentType: "cash",
      paidAmount: 20,
      userId: user.id,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const sale = await getSale(result.id);
    expect(sale?.items[0].isService).toBe(true);
  });

  it("warns and blocks below-cost sales unless confirmed", async () => {
    const { user, warehouse, product } = await seedSaleScenario();
    const blocked = await createSale({
      items: [
        { productId: product.id, quantity: 2, unitPrice: 8, warehouseId: warehouse.id },
      ],
      paymentType: "cash",
      paidAmount: 16,
      userId: user.id,
    });
    expect(blocked.ok).toBe(false);
    expect((blocked as { belowCost?: boolean }).belowCost).toBe(true);

    const allowed = await createSale({
      items: [
        { productId: product.id, quantity: 2, unitPrice: 8, warehouseId: warehouse.id },
      ],
      paymentType: "cash",
      paidAmount: 16,
      userId: user.id,
      allowBelowCost: true,
    });
    expect(allowed.ok).toBe(true);
  });

  it("handles credit sales with customer balances", async () => {
    const { user, warehouse, product, customer } = await seedSaleScenario();
    const noCustomer = await createSale({
      items: [
        { productId: product.id, quantity: 1, unitPrice: 15, warehouseId: warehouse.id },
      ],
      paymentType: "credit",
      paidAmount: 0,
      userId: user.id,
    });
    expect(noCustomer.ok).toBe(false);

    const partial = await createSale({
      items: [
        { productId: product.id, quantity: 2, unitPrice: 15, warehouseId: warehouse.id },
      ],
      customerId: customer.id,
      paymentType: "credit",
      paidAmount: 10,
      userId: user.id,
    });
    expect(partial.ok).toBe(true);
    if (!partial.ok) return;
    expect(partial.paymentStatus).toBe("partial");
    const sale = await getSale(partial.id);
    expect(sale?.payments).toHaveLength(1);
  });

  it("processes returns and restores stock", async () => {
    const { user, warehouse, product } = await seedSaleScenario();
    const created = await createSale({
      items: [
        { productId: product.id, quantity: 10, unitPrice: 15, warehouseId: warehouse.id },
      ],
      paymentType: "cash",
      paidAmount: 150,
      userId: user.id,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const sale = await getSale(created.id);
    const itemId = sale!.items[0].id;

    const over = await processReturn(created.id, {
      items: [{ saleItemId: itemId, quantity: 11 }],
      reason: "تجربة",
      userId: user.id,
    });
    expect(over.ok).toBe(false);

    const partial = await processReturn(created.id, {
      items: [{ saleItemId: itemId, quantity: 4 }],
      reason: "عيب مصنعي",
      userId: user.id,
    });
    expect(partial.ok).toBe(true);
    expect(await stockQty(product.id, warehouse.id)).toBe(94);

    const full = await processReturn(created.id, {
      items: [{ saleItemId: itemId, quantity: 6 }],
      reason: "باقي الكمية",
      userId: user.id,
    });
    expect(full.ok).toBe(true);
    expect((await getSale(created.id))?.status).toBe("returned");
    expect(await stockQty(product.id, warehouse.id)).toBe(100);
  });

  it("cancels sales and restores remaining stock", async () => {
    const { user, warehouse, product } = await seedSaleScenario();
    const created = await createSale({
      items: [
        { productId: product.id, quantity: 5, unitPrice: 15, warehouseId: warehouse.id },
      ],
      paymentType: "cash",
      paidAmount: 75,
      userId: user.id,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect((await cancelSale(created.id, user.id)).ok).toBe(true);
    expect((await getSale(created.id))?.status).toBe("cancelled");
    expect(await stockQty(product.id, warehouse.id)).toBe(100);
  });

  it("lists sales and computes stats", async () => {
    const { user, warehouse, product } = await seedSaleScenario();
    await createSale({
      items: [
        { productId: product.id, quantity: 1, unitPrice: 15, warehouseId: warehouse.id },
      ],
      paymentType: "cash",
      paidAmount: 15,
      userId: user.id,
    });
    const listed = await listSales({});
    expect(listed.length).toBeGreaterThan(0);
    const stats = await getSalesStats();
    expect(stats.totalCount).toBeGreaterThan(0);
    expect(stats.totalRevenue).toBeGreaterThan(0);
    expect(stats.todayCount).toBeGreaterThan(0);
  });
});
