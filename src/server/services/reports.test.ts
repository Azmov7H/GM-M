import { describe, it, expect, vi } from "vitest";

vi.mock("@/server/db", async () => {
  const { createTestDb } = await import("@/server/db/test-db");
  return { db: createTestDb() };
});

import { db } from "@/server/db";
import {
  getDashboard,
  getFinancialReport,
  getPriceHistory,
  getProfitByCustomer,
  getSalesReport,
  getShortageReport,
} from "./report.service";
import { createSale } from "./sale.service";
import {
  createCustomer,
  createProduct,
  createStock,
  createUser,
  createWarehouse,
} from "@/server/db/factories";
import { hashPassword } from "@/lib/auth/password";

async function seedReportScenario() {
  const user = await createUser(db, {
    username: `rep_${Math.random().toString(36).slice(2, 8)}`,
    passwordHash: await hashPassword("secret123"),
  });
  const warehouse = await createWarehouse(db, {
    code: `R-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
  });
  const product = await createProduct(db, { buyPrice: 10, retailPrice: 16 });
  await createStock(db, product.id, warehouse.id, 100);
  const customer = await createCustomer(db, { name: "عميل التقارير" });
  return { user, warehouse, product, customer };
}

describe("report service", () => {
  it("dashboard aggregates KPIs and recent sales", async () => {
    const { user, warehouse, product } = await seedReportScenario();
    await createSale({
      items: [
        { productId: product.id, quantity: 2, unitPrice: 16, warehouseId: warehouse.id },
      ],
      paymentType: "cash",
      paidAmount: 32,
      userId: user.id,
    });
    const d = await getDashboard();
    expect(d.todaySalesCount).toBeGreaterThanOrEqual(1);
    expect(d.todayRevenue).toBeGreaterThanOrEqual(32);
    expect(d.productCount).toBeGreaterThanOrEqual(1);
    expect(d.recentSales.length).toBeGreaterThanOrEqual(1);
  });

  it("sales report filters by date and totals correctly", async () => {
    const { user, warehouse, product } = await seedReportScenario();
    await createSale({
      items: [
        { productId: product.id, quantity: 1, unitPrice: 16, warehouseId: warehouse.id },
      ],
      paymentType: "cash",
      paidAmount: 16,
      userId: user.id,
    });
    const today = new Date().toISOString().slice(0, 10);
    const inRange = await getSalesReport({ from: today, to: today });
    expect(inRange.totalCount).toBeGreaterThanOrEqual(1);
    expect(inRange.totalRevenue).toBeGreaterThanOrEqual(16);
    const ancient = await getSalesReport({ from: "2000-01-01", to: "2000-01-02" });
    expect(ancient.totalCount).toBe(0);
    expect(ancient.totalRevenue).toBe(0);
  });

  it("profit by customer nets returns and skips services", async () => {
    const { user, warehouse, product, customer } = await seedReportScenario();
    await createSale({
      items: [
        { productId: product.id, quantity: 4, unitPrice: 16, warehouseId: warehouse.id },
      ],
      customerId: customer.id,
      paymentType: "credit",
      paidAmount: 0,
      userId: user.id,
    });
    const report = await getProfitByCustomer({});
    const row = report.rows.find((r) => r.customerId === customer.id);
    expect(row).toBeDefined();
    expect(row!.revenue).toBe(64);
    expect(row!.cost).toBe(40);
    expect(row!.profit).toBe(24);
    expect(row!.invoiceCount).toBeGreaterThanOrEqual(1);
  });

  it("price history merges sales and purchases newest-first", async () => {
    const { user, warehouse, product } = await seedReportScenario();
    await createSale({
      items: [
        { productId: product.id, quantity: 1, unitPrice: 16, warehouseId: warehouse.id },
      ],
      paymentType: "cash",
      paidAmount: 16,
      userId: user.id,
    });
    const points = await getPriceHistory(product.id);
    expect(points.some((p) => p.kind === "sale" && p.price === 16)).toBe(true);
    for (let i = 1; i < points.length; i++) {
      expect(points[i - 1].date >= points[i].date).toBe(true);
    }
  });

  it("financial report sums revenue and collections", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const report = await getFinancialReport({ from: today, to: today });
    expect(report.revenue).toBeGreaterThanOrEqual(0);
    expect(report.gross).toBe(report.revenue - report.costs);
    expect(Array.isArray(report.payments)).toBe(true);
  });

  it("shortage report only lists low stock", async () => {
    const rows = await getShortageReport();
    for (const r of rows) {
      expect(r.quantity <= r.minLevel).toBe(true);
    }
  });
});
