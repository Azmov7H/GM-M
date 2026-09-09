import { describe, it, expect, vi } from "vitest";

vi.mock("@/server/db", async () => {
  const { createTestDb } = await import("@/server/db/test-db");
  return { db: createTestDb() };
});

import {
  createCustomerFull,
  createSupplierFull,
  deactivateCustomer,
  deactivateSupplier,
  getCustomerDetail,
  getDebtsSummary,
  getSupplierDetail,
  listCustomersFull,
  listSuppliersFull,
  recordCustomerPayment,
  recordSupplierPayment,
  updateCustomer,
  updateSupplier,
} from "./party.service";
import { createCustomer, createSupplier, createUser } from "@/server/db/factories";
import { db } from "@/server/db";
import { hashPassword } from "@/lib/auth/password";

async function seedUser() {
  return createUser(db, {
    username: `party_${Math.random().toString(36).slice(2, 8)}`,
    passwordHash: await hashPassword("secret123"),
  });
}

describe("party service - customers", () => {
  it("creates, updates, and deactivates a customer", async () => {
    const user = await seedUser();
    const created = await createCustomerFull(
      { name: "عميل جديد", phone: "0500000001" },
      user.id,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await updateCustomer(
      created.id,
      { name: "عميل معدل", phone: null },
      user.id,
    );
    expect(updated.ok).toBe(true);

    const list = await listCustomersFull("معدل");
    expect(list.some((c) => c.id === created.id)).toBe(true);

    const deactivated = await deactivateCustomer(created.id, user.id);
    expect(deactivated.ok).toBe(true);
    expect((await listCustomersFull()).some((c) => c.id === created.id)).toBe(false);
  });

  it("records a collection and reduces balance, rejects over-collection", async () => {
    const user = await seedUser();
    const cust = await createCustomer(db, { balance: 100 });
    const pay = await recordCustomerPayment(cust.id, 40, "cash", null, user.id);
    expect(pay.ok).toBe(true);
    if (!pay.ok) return;
    expect(pay.balance).toBe(60);

    const over = await recordCustomerPayment(cust.id, 61, "cash", null, user.id);
    expect(over.ok).toBe(false);

    const detail = await getCustomerDetail(cust.id);
    expect(detail!.payments.length).toBeGreaterThanOrEqual(1);
    expect(detail!.balance).toBe(60);
  });

  it("refuses to deactivate a customer with outstanding balance", async () => {
    const user = await seedUser();
    const cust = await createCustomer(db, { balance: 25 });
    expect((await deactivateCustomer(cust.id, user.id)).ok).toBe(false);
  });
});

describe("party service - suppliers", () => {
  it("creates, updates, and deactivates a supplier", async () => {
    const user = await seedUser();
    const created = await createSupplierFull({ name: "مورد جديد" }, user.id);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect((await updateSupplier(created.id, { name: "مورد معدل" }, user.id)).ok).toBe(
      true,
    );
    expect((await listSuppliersFull("معدل")).some((s) => s.id === created.id)).toBe(true);
    expect((await deactivateSupplier(created.id, user.id)).ok).toBe(true);
  });

  it("records a supplier payment and reduces balance, rejects over-payment", async () => {
    const user = await seedUser();
    const supp = await createSupplier(db, { balance: 200 });
    const pay = await recordSupplierPayment(supp.id, 200, "bank", "تسوية", user.id);
    expect(pay.ok).toBe(true);
    if (!pay.ok) return;
    expect(pay.balance).toBe(0);

    const detail = await getSupplierDetail(supp.id);
    expect(detail!.payments.length).toBeGreaterThanOrEqual(1);

    expect((await recordSupplierPayment(supp.id, 1, "cash", null, user.id)).ok).toBe(
      false,
    );
  });
});

describe("debts summary", () => {
  it("aggregates receivables and payables", async () => {
    await createCustomer(db, { balance: 50 });
    await createSupplier(db, { balance: 80 });
    const summary = await getDebtsSummary();
    expect(summary.receivableTotal).toBeGreaterThanOrEqual(50);
    expect(summary.payableTotal).toBeGreaterThanOrEqual(80);
    expect(summary.debtors.length).toBeGreaterThanOrEqual(1);
    expect(summary.creditors.length).toBeGreaterThanOrEqual(1);
  });
});
