import { randomUUID } from "crypto";
import { and, asc, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/server/db";
import { customers, payments, purchases, sales, suppliers } from "@/server/db/schema";
import { uid } from "@/server/db/factories";
import { logAudit } from "./audit.service";

// ---------------------------------------------------------------- customers
export interface CustomerInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export async function listCustomersFull(search?: string) {
  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
      address: customers.address,
      balance: customers.balance,
      isActive: customers.isActive,
      createdAt: customers.createdAt,
    })
    .from(customers)
    .where(isNull(customers.deletedAt))
    .orderBy(asc(customers.name));
  if (!search?.trim()) return rows;
  const q = search.trim().toLowerCase();
  return rows.filter(
    (r) => r.name.toLowerCase().includes(q) || (r.phone ?? "").toLowerCase().includes(q),
  );
}

export async function getCustomer(id: string) {
  const row = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return row[0] ?? null;
}

export async function createCustomerFull(input: CustomerInput, userId: string) {
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "اسم العميل مطلوب" };
  const id = uid("cust");
  await db.insert(customers).values({
    id,
    name,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    address: input.address?.trim() || null,
    isActive: true,
  });
  await logAudit({
    userId,
    action: "create",
    resource: "customers",
    resourceId: id,
    details: `عميل جديد: ${name}`,
  });
  return { ok: true as const, id };
}

export async function updateCustomer(id: string, input: CustomerInput, userId: string) {
  const row = await getCustomer(id);
  if (!row || row.deletedAt) return { ok: false as const, error: "العميل غير موجود" };
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "اسم العميل مطلوب" };
  await db
    .update(customers)
    .set({
      name,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(customers.id, id));
  await logAudit({
    userId,
    action: "update",
    resource: "customers",
    resourceId: id,
    details: `تعديل العميل: ${name}`,
  });
  return { ok: true as const };
}

export async function deactivateCustomer(id: string, userId: string) {
  const row = await getCustomer(id);
  if (!row || row.deletedAt) return { ok: false as const, error: "العميل غير موجود" };
  if ((row.balance ?? 0) > 0.009)
    return { ok: false as const, error: "لا يمكن إيقاف عميل عليه رصيد مستحق" };
  await db
    .update(customers)
    .set({ isActive: false, deletedAt: new Date().toISOString() })
    .where(eq(customers.id, id));
  await logAudit({
    userId,
    action: "delete",
    resource: "customers",
    resourceId: id,
    details: `إيقاف العميل: ${row.name}`,
  });
  return { ok: true as const };
}

export async function getCustomerDetail(id: string) {
  const row = await getCustomer(id);
  if (!row || row.deletedAt) return null;
  const [saleRows, paymentRows] = await Promise.all([
    db
      .select({
        id: sales.id,
        invoiceNumber: sales.invoiceNumber,
        total: sales.total,
        paymentStatus: sales.paymentStatus,
        status: sales.status,
        createdAt: sales.createdAt,
      })
      .from(sales)
      .where(eq(sales.customerId, id))
      .orderBy(desc(sales.invoiceNumber))
      .limit(200),
    db
      .select()
      .from(payments)
      .where(and(eq(payments.entityType, "customer"), eq(payments.entityId, id)))
      .orderBy(desc(payments.createdAt))
      .limit(200),
  ]);
  return { ...row, sales: saleRows, payments: paymentRows };
}

export async function recordCustomerPayment(
  id: string,
  amount: number,
  paymentType: string,
  notes: string | null,
  userId: string,
) {
  if (!Number.isFinite(amount) || amount <= 0)
    return { ok: false as const, error: "المبلغ يجب أن يكون أكبر من صفر" };
  const row = await getCustomer(id);
  if (!row || row.deletedAt) return { ok: false as const, error: "العميل غير موجود" };
  const balance = row.balance ?? 0;
  if (amount - balance > 0.009)
    return {
      ok: false as const,
      error: `المبلغ يتجاوز الرصيد المستحق (${balance.toFixed(2)})`,
    };
  db.transaction((tx) => {
    tx.insert(payments)
      .values({
        id: `pay_${randomUUID().slice(0, 8)}`,
        entityType: "customer",
        entityId: id,
        saleId: null,
        amount,
        paymentType,
        notes: notes?.trim() || null,
        userId,
      })
      .run();
    tx.update(customers)
      .set({ balance: balance - amount })
      .where(eq(customers.id, id))
      .run();
  });
  await logAudit({
    userId,
    action: "payment",
    resource: "customers",
    resourceId: id,
    details: `تحصيل ${amount} من ${row.name}`,
  });
  return { ok: true as const, balance: balance - amount };
}

// ---------------------------------------------------------------- suppliers
export interface SupplierInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export async function listSuppliersFull(search?: string) {
  const rows = await db
    .select({
      id: suppliers.id,
      name: suppliers.name,
      phone: suppliers.phone,
      email: suppliers.email,
      address: suppliers.address,
      balance: suppliers.balance,
      isActive: suppliers.isActive,
      createdAt: suppliers.createdAt,
    })
    .from(suppliers)
    .where(isNull(suppliers.deletedAt))
    .orderBy(asc(suppliers.name));
  if (!search?.trim()) return rows;
  const q = search.trim().toLowerCase();
  return rows.filter(
    (r) => r.name.toLowerCase().includes(q) || (r.phone ?? "").toLowerCase().includes(q),
  );
}

export async function getSupplier(id: string) {
  const row = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return row[0] ?? null;
}

export async function createSupplierFull(input: SupplierInput, userId: string) {
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "اسم المورد مطلوب" };
  const id = uid("supp");
  await db.insert(suppliers).values({
    id,
    name,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    address: input.address?.trim() || null,
    isActive: true,
  });
  await logAudit({
    userId,
    action: "create",
    resource: "suppliers",
    resourceId: id,
    details: `مورد جديد: ${name}`,
  });
  return { ok: true as const, id };
}

export async function updateSupplier(id: string, input: SupplierInput, userId: string) {
  const row = await getSupplier(id);
  if (!row || row.deletedAt) return { ok: false as const, error: "المورد غير موجود" };
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "اسم المورد مطلوب" };
  await db
    .update(suppliers)
    .set({
      name,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(suppliers.id, id));
  await logAudit({
    userId,
    action: "update",
    resource: "suppliers",
    resourceId: id,
    details: `تعديل المورد: ${name}`,
  });
  return { ok: true as const };
}

export async function deactivateSupplier(id: string, userId: string) {
  const row = await getSupplier(id);
  if (!row || row.deletedAt) return { ok: false as const, error: "المورد غير موجود" };
  if ((row.balance ?? 0) > 0.009)
    return { ok: false as const, error: "لا يمكن إيقاف مورد عليه رصيد مستحق" };
  await db
    .update(suppliers)
    .set({ isActive: false, deletedAt: new Date().toISOString() })
    .where(eq(suppliers.id, id));
  await logAudit({
    userId,
    action: "delete",
    resource: "suppliers",
    resourceId: id,
    details: `إيقاف المورد: ${row.name}`,
  });
  return { ok: true as const };
}

export async function getSupplierDetail(id: string) {
  const row = await getSupplier(id);
  if (!row || row.deletedAt) return null;
  const [purchaseRows, paymentRows] = await Promise.all([
    db
      .select({
        id: purchases.id,
        orderNumber: purchases.orderNumber,
        total: purchases.total,
        status: purchases.status,
        createdAt: purchases.createdAt,
      })
      .from(purchases)
      .where(eq(purchases.supplierId, id))
      .orderBy(desc(purchases.orderNumber))
      .limit(200),
    db
      .select()
      .from(payments)
      .where(and(eq(payments.entityType, "supplier"), eq(payments.entityId, id)))
      .orderBy(desc(payments.createdAt))
      .limit(200),
  ]);
  return { ...row, purchases: purchaseRows, payments: paymentRows };
}

export async function recordSupplierPayment(
  id: string,
  amount: number,
  paymentType: string,
  notes: string | null,
  userId: string,
) {
  if (!Number.isFinite(amount) || amount <= 0)
    return { ok: false as const, error: "المبلغ يجب أن يكون أكبر من صفر" };
  const row = await getSupplier(id);
  if (!row || row.deletedAt) return { ok: false as const, error: "المورد غير موجود" };
  const balance = row.balance ?? 0;
  if (amount - balance > 0.009)
    return {
      ok: false as const,
      error: `المبلغ يتجاوز الرصيد المستحق (${balance.toFixed(2)})`,
    };
  db.transaction((tx) => {
    tx.insert(payments)
      .values({
        id: `pay_${randomUUID().slice(0, 8)}`,
        entityType: "supplier",
        entityId: id,
        saleId: null,
        amount,
        paymentType,
        notes: notes?.trim() || null,
        userId,
      })
      .run();
    tx.update(suppliers)
      .set({ balance: balance - amount })
      .where(eq(suppliers.id, id))
      .run();
  });
  await logAudit({
    userId,
    action: "payment",
    resource: "suppliers",
    resourceId: id,
    details: `سداد ${amount} للمورد ${row.name}`,
  });
  return { ok: true as const, balance: balance - amount };
}

// ---------------------------------------------------------------- debt center
export async function getDebtsSummary() {
  const [custRows, suppRows] = await Promise.all([
    db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        balance: customers.balance,
      })
      .from(customers)
      .where(isNull(customers.deletedAt))
      .orderBy(desc(customers.balance)),
    db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        phone: suppliers.phone,
        balance: suppliers.balance,
      })
      .from(suppliers)
      .where(isNull(suppliers.deletedAt))
      .orderBy(desc(suppliers.balance)),
  ]);
  const debtors = custRows.filter((r) => (r.balance ?? 0) > 0.009);
  const creditors = suppRows.filter((r) => (r.balance ?? 0) > 0.009);
  const sum = (rs: { balance: number | null }[]) =>
    rs.reduce((s, r) => s + (r.balance ?? 0), 0);
  return {
    receivableTotal: sum(debtors),
    receivableCount: debtors.length,
    payableTotal: sum(creditors),
    payableCount: creditors.length,
    debtors,
    creditors,
  };
}
