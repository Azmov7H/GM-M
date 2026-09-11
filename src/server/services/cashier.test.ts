import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", async () => {
  const { createTestDb } = await import("@/server/db/test-db");
  return { db: createTestDb() };
});

import { db } from "@/server/db";
import { payments, saleReturns, sales } from "@/server/db/schema";
import { createUser as mkUser } from "@/server/db/factories";
import { getCashierSummary } from "./cashier.service";

describe("cashier summary", () => {
  it("aggregates sales, payments, and returns for the day", async () => {
    const user = await mkUser(db, { username: "cashier_probe" });
    const today = new Date().toISOString().slice(0, 10);

    await db.insert(sales).values([
      {
        id: "sale_cash_1",
        invoiceNumber: 101,
        userId: user.id,
        total: 100,
        discount: 10,
        paymentType: "cash",
        paymentStatus: "paid",
      },
      {
        id: "sale_credit_1",
        invoiceNumber: 102,
        userId: user.id,
        total: 250,
        paymentType: "credit",
        paymentStatus: "unpaid",
      },
      {
        id: "sale_old_1",
        invoiceNumber: 103,
        userId: user.id,
        total: 999,
        paymentType: "cash",
        paymentStatus: "paid",
        createdAt: "2020-01-01T10:00:00.000Z",
      },
      {
        id: "sale_cancelled_1",
        invoiceNumber: 104,
        userId: user.id,
        total: 500,
        paymentType: "cash",
        paymentStatus: "paid",
        status: "cancelled",
      },
    ]);
    await db.insert(payments).values([
      {
        id: "pay_in_1",
        entityType: "customer",
        entityId: "cust_1",
        saleId: "sale_credit_1",
        amount: 50,
        paymentType: "cash",
        userId: user.id,
      },
      {
        id: "pay_out_1",
        entityType: "supplier",
        entityId: "supp_1",
        amount: 20,
        paymentType: "cash",
        userId: user.id,
      },
    ]);
    await db.insert(saleReturns).values({
      id: "ret_1",
      saleId: "sale_cash_1",
      userId: user.id,
      reason: "عيب",
      total: 30,
    });

    const s = await getCashierSummary(today);
    expect(s.invoiceCount).toBe(2);
    expect(s.cashTotal).toBe(100);
    expect(s.creditTotal).toBe(250);
    expect(s.discountTotal).toBe(10);
    expect(s.collectedTotal).toBe(50);
    expect(s.paidOutTotal).toBe(20);
    expect(s.returnsTotal).toBe(30);
    expect(s.returnsCount).toBe(1);
    expect(s.expectedCash).toBe(100 + 50 - 20 - 30);
  });

  it("handles month boundaries in the day range", async () => {
    const s = await getCashierSummary("2026-01-31");
    expect(s.date).toBe("2026-01-31");
    expect(s.invoiceCount).toBe(0);
  });
});
