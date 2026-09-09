import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";

import { db } from "@/server/db";
import {
  customers,
  payments,
  saleItems,
  saleReturns,
  sales,
  stockMovements,
  stocks,
} from "@/server/db/schema";
import { uid } from "@/server/db/factories";
import { logAudit } from "./audit.service";

export interface ReturnItemInput {
  saleItemId: string;
  quantity: number;
}

export async function processReturn(
  saleId: string,
  input: { items: ReturnItemInput[]; reason: string; userId: string },
) {
  const reason = input.reason.trim();
  if (!reason) return { ok: false as const, error: "سبب المرتجع مطلوب" };
  if (!input.items || input.items.length === 0) {
    return { ok: false as const, error: "حدد صنفاً واحداً على الأقل للمرتجع" };
  }

  const saleRows = await db.select().from(sales).where(eq(sales.id, saleId)).limit(1);
  const sale = saleRows[0];
  if (!sale) return { ok: false as const, error: "الفاتورة غير موجودة" };
  if (sale.status === "cancelled") {
    return { ok: false as const, error: "لا يمكن إرجاع فاتورة ملغاة" };
  }
  if (sale.status === "returned") {
    return { ok: false as const, error: "الفاتورة مرتجعة بالكامل مسبقاً" };
  }

  const itemRows = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
  const itemById = new Map(itemRows.map((i) => [i.id, i]));

  let refundTotal = 0;
  for (const ri of input.items) {
    const qty = Math.floor(ri.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return { ok: false as const, error: "كميات المرتجع يجب أن تكون 1 على الأقل" };
    }
    const item = itemById.get(ri.saleItemId);
    if (!item) return { ok: false as const, error: "أحد أصناف المرتجع غير موجود" };
    const available = item.quantity - item.returnedQuantity;
    if (qty > available) {
      return {
        ok: false as const,
        error: `كمية المرتجع من "${item.productName}" تتجاوز المتاح (${available})`,
      };
    }
    refundTotal += qty * item.unitPrice;
  }

  const returnId = uid("sret");
  const now = new Date().toISOString();
  const movementId = () => `mov_${randomUUID().slice(0, 8)}`;

  db.transaction((tx) => {
    tx.insert(saleReturns)
      .values({ id: returnId, saleId, userId: input.userId, reason, total: refundTotal })
      .run();

    for (const ri of input.items) {
      const item = itemById.get(ri.saleItemId)!;
      const qty = Math.floor(ri.quantity);
      tx.update(saleItems)
        .set({ returnedQuantity: item.returnedQuantity + qty })
        .where(eq(saleItems.id, item.id))
        .run();

      if (!item.isService && item.productId) {
        const stockRow = tx
          .select({ quantity: stocks.quantity })
          .from(stocks)
          .where(
            and(
              eq(stocks.productId, item.productId),
              eq(stocks.warehouseId, item.warehouseId),
            ),
          )
          .limit(1)
          .all()[0];
        if (stockRow) {
          tx.update(stocks)
            .set({ quantity: stockRow.quantity + qty, updatedAt: now })
            .where(
              and(
                eq(stocks.productId, item.productId),
                eq(stocks.warehouseId, item.warehouseId),
              ),
            )
            .run();
        } else {
          tx.insert(stocks)
            .values({
              id: `stock_${randomUUID().slice(0, 8)}`,
              productId: item.productId,
              warehouseId: item.warehouseId,
              quantity: qty,
              updatedAt: now,
            })
            .run();
        }
        tx.insert(stockMovements)
          .values({
            id: movementId(),
            productId: item.productId,
            warehouseId: item.warehouseId,
            quantity: qty,
            type: "IN",
            referenceType: "return",
            referenceId: returnId,
            reason,
            userId: input.userId,
          })
          .run();
      }
    }

    const remaining = tx
      .select({
        quantity: saleItems.quantity,
        returnedQuantity: saleItems.returnedQuantity,
      })
      .from(saleItems)
      .where(eq(saleItems.saleId, saleId))
      .all();
    const fullyReturned = remaining.every((r) => r.returnedQuantity >= r.quantity);
    tx.update(sales)
      .set({ status: fullyReturned ? "returned" : "completed", updatedAt: now })
      .where(eq(sales.id, saleId))
      .run();

    if (sale.customerId && refundTotal > 0) {
      const custRow = tx
        .select({ balance: customers.balance })
        .from(customers)
        .where(eq(customers.id, sale.customerId))
        .limit(1)
        .all()[0];
      tx.update(customers)
        .set({ balance: (custRow?.balance ?? 0) - refundTotal })
        .where(eq(customers.id, sale.customerId))
        .run();
      if (sale.paymentStatus === "paid") {
        tx.insert(payments)
          .values({
            id: `pay_${randomUUID().slice(0, 8)}`,
            entityType: "customer",
            entityId: sale.customerId,
            saleId,
            amount: -refundTotal,
            paymentType: sale.paymentType,
            notes: `مرتجع: ${reason}`,
            userId: input.userId,
          })
          .run();
      }
    }
  });

  await logAudit({
    userId: input.userId,
    action: "return",
    resource: "sales",
    resourceId: saleId,
    details: `مرتجع ${returnId} بمبلغ ${refundTotal} — ${reason}`,
  });
  return { ok: true as const, id: returnId, total: refundTotal };
}

export async function cancelSale(saleId: string, userId: string) {
  const saleRows = await db.select().from(sales).where(eq(sales.id, saleId)).limit(1);
  const sale = saleRows[0];
  if (!sale) return { ok: false as const, error: "الفاتورة غير موجودة" };
  if (sale.status === "cancelled")
    return { ok: false as const, error: "الفاتورة ملغاة مسبقاً" };
  if (sale.status === "returned") {
    return { ok: false as const, error: "لا يمكن إلغاء فاتورة مرتجعة بالكامل" };
  }

  const now = new Date().toISOString();
  const movementId = () => `mov_${randomUUID().slice(0, 8)}`;

  db.transaction((tx) => {
    const items = tx.select().from(saleItems).where(eq(saleItems.saleId, saleId)).all();
    for (const item of items) {
      const restorable = item.quantity - item.returnedQuantity;
      if (restorable <= 0) continue;
      if (!item.isService && item.productId) {
        const stockRow = tx
          .select({ quantity: stocks.quantity })
          .from(stocks)
          .where(
            and(
              eq(stocks.productId, item.productId),
              eq(stocks.warehouseId, item.warehouseId),
            ),
          )
          .limit(1)
          .all()[0];
        if (stockRow) {
          tx.update(stocks)
            .set({ quantity: stockRow.quantity + restorable, updatedAt: now })
            .where(
              and(
                eq(stocks.productId, item.productId),
                eq(stocks.warehouseId, item.warehouseId),
              ),
            )
            .run();
        }
        tx.insert(stockMovements)
          .values({
            id: movementId(),
            productId: item.productId,
            warehouseId: item.warehouseId,
            quantity: restorable,
            type: "IN",
            referenceType: "cancel",
            referenceId: saleId,
            reason: "إلغاء فاتورة",
            userId,
          })
          .run();
      }
      tx.update(saleItems)
        .set({ returnedQuantity: item.quantity })
        .where(eq(saleItems.id, item.id))
        .run();
    }
    tx.update(sales)
      .set({ status: "cancelled", updatedAt: now })
      .where(eq(sales.id, saleId))
      .run();

    if (sale.customerId) {
      const custRow = tx
        .select({ balance: customers.balance })
        .from(customers)
        .where(eq(customers.id, sale.customerId))
        .limit(1)
        .all()[0];
      const paidRows = tx
        .select({ amount: payments.amount })
        .from(payments)
        .where(eq(payments.saleId, saleId))
        .all();
      const paidPositive = paidRows.reduce((s, p) => s + Math.max(0, p.amount), 0);
      const refundRows = tx
        .select({ total: saleReturns.total })
        .from(saleReturns)
        .where(eq(saleReturns.saleId, saleId))
        .all();
      const refunded = refundRows.reduce((s, r) => s + r.total, 0);
      const stillOwed = sale.total - paidPositive - refunded;
      tx.update(customers)
        .set({ balance: (custRow?.balance ?? 0) - stillOwed })
        .where(eq(customers.id, sale.customerId))
        .run();
    }
  });

  await logAudit({ userId, action: "cancel", resource: "sales", resourceId: saleId });
  return { ok: true as const };
}
