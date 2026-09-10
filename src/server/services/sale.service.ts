import { randomUUID } from "crypto";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/server/db";
import {
  customers,
  payments,
  products,
  saleItems,
  saleReturns,
  sales,
  settings,
  stockMovements,
  stocks,
  users,
} from "@/server/db/schema";
import { uid } from "@/server/db/factories";
import { logAudit } from "./audit.service";

export const IMMEDIATE_PAYMENT_TYPES = ["cash", "bank", "wallet", "check"] as const;
export type SalePaymentType = "cash" | "credit" | "bank" | "wallet" | "check";

export interface SaleItemInput {
  productId?: string | null;
  productName?: string;
  quantity: number;
  unitPrice: number;
  warehouseId: string;
  isService?: boolean;
}

export interface CreateSaleInput {
  items: SaleItemInput[];
  customerId?: string | null;
  discount?: number;
  tax?: number;
  paymentType: SalePaymentType;
  paidAmount?: number;
  notes?: string | null;
  userId: string;
  allowBelowCost?: boolean;
}

export interface BelowCostLine {
  productId: string;
  productName: string;
  unitPrice: number;
  buyPrice: number;
}

async function getAllowBelowCostSetting(): Promise<boolean> {
  const rows = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, "sale.allow_below_cost"))
    .limit(1);
  return rows[0]?.value === "true";
}

export async function createSale(input: CreateSaleInput) {
  if (!input.items || input.items.length === 0) {
    return { ok: false as const, error: "الفاتورة يجب أن تحتوي على صنف واحد على الأقل" };
  }
  const discount = input.discount ?? 0;
  const tax = input.tax ?? 0;
  if (discount < 0 || tax < 0) {
    return { ok: false as const, error: "الخصم والضريبة يجب أن يكونا صفراً أو أكثر" };
  }

  for (const [i, item] of input.items.entries()) {
    const qty = Math.floor(item.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return { ok: false as const, error: `كمية الصنف ${i + 1} يجب أن تكون 1 على الأقل` };
    }
    if (
      item.unitPrice === undefined ||
      item.unitPrice < 0 ||
      !Number.isFinite(item.unitPrice)
    ) {
      return { ok: false as const, error: `سعر الصنف ${i + 1} غير صالح` };
    }
    if (!item.warehouseId) {
      return { ok: false as const, error: `مخزن الصنف ${i + 1} مطلوب` };
    }
  }

  const productIds = Array.from(
    new Set(
      input.items
        .filter((i) => !i.isService && i.productId)
        .map((i) => i.productId as string),
    ),
  );
  const productRows =
    productIds.length > 0
      ? await db
          .select()
          .from(products)
          .where(and(isNull(products.deletedAt), inArray(products.id, productIds)))
      : [];
  const productById = new Map(productRows.map((p) => [p.id, p]));

  // Batch stock check: one query for all requested product/warehouse pairs.
  const stockPairs = input.items.filter((i) => !i.isService && i.productId);
  const stockRows =
    stockPairs.length > 0
      ? await db
          .select({
            productId: stocks.productId,
            warehouseId: stocks.warehouseId,
            quantity: stocks.quantity,
          })
          .from(stocks)
          .where(
            inArray(
              stocks.productId,
              stockPairs.map((i) => i.productId as string),
            ),
          )
      : [];
  const stockByPair = new Map(
    stockRows.map((r) => [`${r.productId}:${r.warehouseId}`, r.quantity]),
  );

  for (const item of input.items) {
    if (item.isService) {
      if (!item.productName?.trim()) {
        return { ok: false as const, error: "اسم الصنف الخدمي مطلوب" };
      }
      continue;
    }
    const product = item.productId ? productById.get(item.productId) : undefined;
    if (!product) {
      return { ok: false as const, error: "أحد الأصناف غير موجود" };
    }
    const available = stockByPair.get(`${product.id}:${item.warehouseId}`) ?? 0;
    if (available < Math.floor(item.quantity)) {
      return {
        ok: false as const,
        error: `الكمية المتاحة من "${product.name}" غير كافية (${available})`,
      };
    }
  }

  const lines = input.items.map((item) => {
    const qty = Math.floor(item.quantity);
    const product =
      !item.isService && item.productId ? productById.get(item.productId) : undefined;
    return {
      productId: product?.id ?? null,
      productName: product?.name ?? item.productName!.trim(),
      productCode: product?.code ?? "SERVICE",
      quantity: qty,
      unitPrice: item.unitPrice,
      total: qty * item.unitPrice,
      warehouseId: item.warehouseId,
      isService: !!item.isService || !product,
      buyPrice: product?.buyPrice ?? 0,
    };
  });

  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  if (discount > subtotal) {
    return { ok: false as const, error: "الخصم لا يمكن أن يتجاوز المجموع الفرعي" };
  }
  const total = subtotal - discount + tax;

  const belowCostLines: BelowCostLine[] = lines
    .filter((l) => !l.isService && l.productId && l.unitPrice < l.buyPrice)
    .map((l) => ({
      productId: l.productId as string,
      productName: l.productName,
      unitPrice: l.unitPrice,
      buyPrice: l.buyPrice,
    }));

  if (belowCostLines.length > 0 && !input.allowBelowCost) {
    const allowBelowCost = await getAllowBelowCostSetting();
    if (!allowBelowCost) {
      return {
        ok: false as const,
        error: "يوجد أصناف بسعر أقل من التكلفة. أكّد البيع للمتابعة.",
        belowCost: true as const,
        belowCostLines,
      };
    }
  }

  let customer: { id: string; name: string } | null = null;
  if (input.customerId) {
    customer = await db
      .select({ id: customers.id, name: customers.name })
      .from(customers)
      .where(eq(customers.id, input.customerId))
      .limit(1)
      .then((r) => r[0] ?? null);
    if (!customer) return { ok: false as const, error: "العميل غير موجود" };
  }

  const paidAmount = input.paidAmount ?? 0;
  if (paidAmount < 0) return { ok: false as const, error: "المبلغ المدفوع غير صالح" };

  let paymentStatus: string;
  if (input.paymentType === "credit") {
    if (!customer) {
      return { ok: false as const, error: "اختر العميل للبيع الآجل" };
    }
    if (paidAmount > total) {
      return { ok: false as const, error: "المبلغ المدفوع يتجاوز الإجمالي" };
    }
    paymentStatus = paidAmount >= total ? "paid" : paidAmount > 0 ? "partial" : "unpaid";
  } else {
    if (Math.abs(paidAmount - total) > 0.009) {
      return { ok: false as const, error: "المبلغ المدفوع يجب أن يساوي إجمالي الفاتورة" };
    }
    paymentStatus = "paid";
  }

  const saleId = uid("sale");
  const now = new Date().toISOString();
  let invoiceNumber = 0;

  try {
    db.transaction((tx) => {
      const maxRow = tx
        .select({ n: sql<number | null>`max(${sales.invoiceNumber})` })
        .from(sales)
        .limit(1)
        .all()[0];
      invoiceNumber = (maxRow?.n ?? 0) + 1;

      tx.insert(sales)
        .values({
          id: saleId,
          invoiceNumber,
          customerId: customer?.id ?? null,
          userId: input.userId,
          subtotal,
          discount,
          tax,
          total,
          paymentType: input.paymentType,
          paymentStatus,
          notes: input.notes?.trim() || null,
          status: "completed",
        })
        .run();

      const movementId = () => `mov_${randomUUID().slice(0, 8)}`;
      for (const line of lines) {
        tx.insert(saleItems)
          .values({
            id: `sitem_${randomUUID().slice(0, 8)}`,
            saleId,
            productId: line.productId,
            productName: line.productName,
            productCode: line.productCode,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            total: line.total,
            warehouseId: line.warehouseId,
            isService: line.isService,
          })
          .run();

        if (!line.isService && line.productId) {
          const stockRow = tx
            .select({ quantity: stocks.quantity })
            .from(stocks)
            .where(
              and(
                eq(stocks.productId, line.productId),
                eq(stocks.warehouseId, line.warehouseId),
              ),
            )
            .limit(1)
            .all()[0];
          const available = stockRow?.quantity ?? 0;
          if (available < line.quantity) {
            throw new Error("INSUFFICIENT_STOCK");
          }
          tx.update(stocks)
            .set({ quantity: available - line.quantity, updatedAt: now })
            .where(
              and(
                eq(stocks.productId, line.productId),
                eq(stocks.warehouseId, line.warehouseId),
              ),
            )
            .run();
          tx.insert(stockMovements)
            .values({
              id: movementId(),
              productId: line.productId,
              warehouseId: line.warehouseId,
              quantity: -line.quantity,
              type: "SALE",
              referenceType: "sale",
              referenceId: saleId,
              reason: null,
              userId: input.userId,
            })
            .run();
        }
      }

      if (customer) {
        tx.insert(payments)
          .values({
            id: `pay_${randomUUID().slice(0, 8)}`,
            entityType: "customer",
            entityId: customer.id,
            saleId,
            amount: paidAmount,
            paymentType: input.paymentType,
            notes: null,
            userId: input.userId,
          })
          .run();
        const remaining = total - paidAmount;
        if (remaining > 0) {
          const custRow = tx
            .select({ balance: customers.balance })
            .from(customers)
            .where(eq(customers.id, customer.id))
            .limit(1)
            .all()[0];
          tx.update(customers)
            .set({ balance: (custRow?.balance ?? 0) + remaining })
            .where(eq(customers.id, customer.id))
            .run();
        }
      }
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_STOCK") {
      return { ok: false as const, error: "المخزون المتاح غير كافٍ لأحد الأصناف" };
    }
    throw err;
  }

  await logAudit({
    userId: input.userId,
    action: "create",
    resource: "sales",
    resourceId: saleId,
    details: `فاتورة #${invoiceNumber} بإجمالي ${total}`,
  });

  return {
    ok: true as const,
    id: saleId,
    invoiceNumber,
    total,
    paymentStatus,
    belowCostLines,
  };
}

export async function getSale(id: string) {
  const header = await db
    .select({
      id: sales.id,
      invoiceNumber: sales.invoiceNumber,
      customerId: sales.customerId,
      customerName: customers.name,
      userId: sales.userId,
      userName: users.displayName,
      subtotal: sales.subtotal,
      discount: sales.discount,
      tax: sales.tax,
      total: sales.total,
      paymentType: sales.paymentType,
      paymentStatus: sales.paymentStatus,
      notes: sales.notes,
      status: sales.status,
      createdAt: sales.createdAt,
    })
    .from(sales)
    .leftJoin(customers, eq(sales.customerId, customers.id))
    .leftJoin(users, eq(sales.userId, users.id))
    .where(eq(sales.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!header) return null;

  const [items, paymentRows, returnRows] = await Promise.all([
    db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, id))
      .orderBy(asc(saleItems.createdAt)),
    db.select().from(payments).where(eq(payments.saleId, id)),
    db
      .select()
      .from(saleReturns)
      .where(eq(saleReturns.saleId, id))
      .orderBy(asc(saleReturns.createdAt)),
  ]);
  return { ...header, items, payments: paymentRows, returns: returnRows };
}

export interface SaleListFilter {
  search?: string;
  status?: string;
  limit?: number;
}

export async function listSales(filter: SaleListFilter = {}) {
  const rows = await db
    .select({
      id: sales.id,
      invoiceNumber: sales.invoiceNumber,
      customerName: customers.name,
      userName: users.displayName,
      total: sales.total,
      paymentType: sales.paymentType,
      paymentStatus: sales.paymentStatus,
      status: sales.status,
      createdAt: sales.createdAt,
    })
    .from(sales)
    .leftJoin(customers, eq(sales.customerId, customers.id))
    .leftJoin(users, eq(sales.userId, users.id))
    .orderBy(desc(sales.invoiceNumber))
    .limit(filter.limit ?? 200);

  let out = rows;
  if (filter.status) out = out.filter((r) => r.status === filter.status);
  if (filter.search) {
    const q = filter.search.trim().toLowerCase();
    out = out.filter(
      (r) =>
        String(r.invoiceNumber).includes(q) ||
        (r.customerName ?? "").toLowerCase().includes(q),
    );
  }
  return out;
}

export async function getSalesStats() {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db
    .select({
      total: sales.total,
      status: sales.status,
      createdAt: sales.createdAt,
    })
    .from(sales);
  const valid = rows.filter((r) => r.status !== "cancelled");
  const todayRows = valid.filter((r) => r.createdAt.slice(0, 10) === today);
  const sum = (rs: typeof valid) => rs.reduce((s, r) => s + r.total, 0);
  return {
    todayTotal: sum(todayRows),
    todayCount: todayRows.length,
    totalRevenue: sum(valid),
    totalCount: valid.length,
  };
}
