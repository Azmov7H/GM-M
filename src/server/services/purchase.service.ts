import { randomUUID } from "crypto";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/server/db";
import {
  products,
  purchaseItems,
  purchases,
  stocks,
  stockMovements,
  suppliers,
  users,
} from "@/server/db/schema";
import { uid } from "@/server/db/factories";
import { logAudit } from "./audit.service";

export type PurchaseStatus = "draft" | "submitted" | "received" | "cancelled";

export interface PurchaseItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseInput {
  supplierId: string;
  items: PurchaseItemInput[];
  tax?: number;
  notes?: string | null;
  userId: string;
}

export interface ReceiveInput {
  items: { itemId: string; quantity: number }[];
}

export interface PurchaseListItem {
  id: string;
  orderNumber: number;
  supplierId: string;
  supplierName: string | null;
  userId: string;
  userName: string | null;
  subtotal: number;
  tax: number;
  total: number;
  status: PurchaseStatus;
  notes: string | null;
  createdAt: string;
}

export async function createPurchase(input: CreatePurchaseInput) {
  if (!input.items || input.items.length === 0) {
    return { ok: false as const, error: "الفاتورة يجب أن تحتوي على صنف واحد على الأقل" };
  }
  const tax = input.tax ?? 0;
  if (tax < 0) {
    return { ok: false as const, error: "الضريبة يجب أن تكون صفراً أو أكثر" };
  }
  for (const [i, item] of input.items.entries()) {
    const qty = Math.floor(item.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return { ok: false as const, error: `كمية الصنف ${i + 1} يجب أن تكون 1 على الأقل` };
    }
    if (!Number.isFinite(item.unitCost) || item.unitCost < 0) {
      return { ok: false as const, error: `تكلفة الصنف ${i + 1} غير صالحة` };
    }
  }

  const productIds = Array.from(new Set(input.items.map((i) => i.productId)));
  const productRows = await db.select().from(products).where(isNull(products.deletedAt));
  const productById = new Map(
    productRows.filter((p) => productIds.includes(p.id)).map((p) => [p.id, p]),
  );
  for (const item of input.items) {
    if (!productById.has(item.productId)) {
      return { ok: false as const, error: `الصنف ${item.productId} غير موجود` };
    }
  }

  const supplier = await db
    .select({ id: suppliers.id, name: suppliers.name, balance: suppliers.balance })
    .from(suppliers)
    .where(eq(suppliers.id, input.supplierId))
    .limit(1)
    .then((r) => r[0] ?? null);
  if (!supplier) return { ok: false as const, error: "المورد غير موجود" };

  const lines = input.items.map((item) => {
    const qty = Math.floor(item.quantity);
    const product = productById.get(item.productId)!;
    return {
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      quantity: qty,
      unitCost: item.unitCost,
      total: qty * item.unitCost,
    };
  });
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const total = subtotal + tax;
  const orderNumber =
    (db
      .select({ n: sql<number | null>`max(${purchases.orderNumber})` })
      .from(purchases)
      .limit(1)
      .all()[0]?.n ?? 0) + 1;
  const purchaseId = uid("pur");

  try {
    db.transaction((tx) => {
      tx.insert(purchases)
        .values({
          id: purchaseId,
          orderNumber,
          supplierId: supplier.id,
          userId: input.userId,
          subtotal,
          tax,
          total,
          status: "submitted",
          notes: input.notes?.trim() || null,
        })
        .run();
      for (const line of lines) {
        tx.insert(purchaseItems)
          .values({
            id: `pitem_${randomUUID().slice(0, 8)}`,
            purchaseId,
            productId: line.productId,
            quantity: line.quantity,
            receivedQuantity: 0,
            unitCost: line.unitCost,
            total: line.total,
          })
          .run();
      }
      tx.update(suppliers)
        .set({ balance: (supplier.balance ?? 0) + total })
        .where(eq(suppliers.id, supplier.id))
        .run();
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_STOCK") {
      return { ok: false as const, error: "المخزون المتاح غير كافٍ" };
    }
    throw err;
  }

  await logAudit({
    userId: input.userId,
    action: "create",
    resource: "purchases",
    resourceId: purchaseId,
    details: `امر شراء #${orderNumber} بإجمالي ${total}`,
  });
  return {
    ok: true as const,
    id: purchaseId,
    orderNumber,
    total,
    status: "submitted" as const,
  };
}

export async function listPurchases() {
  const rows = await db
    .select({
      id: purchases.id,
      orderNumber: purchases.orderNumber,
      supplierId: purchases.supplierId,
      userId: purchases.userId,
      subtotal: purchases.subtotal,
      tax: purchases.tax,
      total: purchases.total,
      status: purchases.status,
      notes: purchases.notes,
      createdAt: purchases.createdAt,
    })
    .from(purchases)
    .orderBy(desc(purchases.orderNumber))
    .limit(200);
  const userIds = Array.from(new Set(rows.map((r) => r.userId)));
  const usersRows = await db.select().from(users).where(inArray(users.id, userIds));
  const usersMap = new Map(usersRows.map((u) => [u.id, u]));
  const supplierIds = Array.from(new Set(rows.map((r) => r.supplierId)));
  const suppliersRows = await db
    .select()
    .from(suppliers)
    .where(inArray(suppliers.id, supplierIds));
  const suppliersMap = new Map(suppliersRows.map((s) => [s.id, s]));
  return rows.map((r) => ({
    ...r,
    status: r.status as PurchaseStatus,
    supplierName: suppliersMap.get(r.supplierId)?.name ?? null,
    userName: usersMap.get(r.userId)?.displayName ?? null,
  }));
}

export async function getPurchase(id: string) {
  const header = await db
    .select({
      id: purchases.id,
      orderNumber: purchases.orderNumber,
      supplierId: purchases.supplierId,
      supplierName: suppliers.name,
      userId: purchases.userId,
      userName: users.displayName,
      subtotal: purchases.subtotal,
      tax: purchases.tax,
      total: purchases.total,
      status: purchases.status,
      notes: purchases.notes,
      createdAt: purchases.createdAt,
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .leftJoin(users, eq(purchases.userId, users.id))
    .where(eq(purchases.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!header) return null;
  const items = await db
    .select({
      id: purchaseItems.id,
      productId: purchaseItems.productId,
      productName: products.name,
      productCode: products.code,
      quantity: purchaseItems.quantity,
      receivedQuantity: purchaseItems.receivedQuantity,
      unitCost: purchaseItems.unitCost,
      total: purchaseItems.total,
      createdAt: purchaseItems.createdAt,
    })
    .from(purchaseItems)
    .innerJoin(products, eq(purchaseItems.productId, products.id))
    .where(eq(purchaseItems.purchaseId, id))
    .orderBy(asc(purchaseItems.createdAt));
  return { ...header, items };
}

export async function receivePurchase(input: ReceiveInput, userId: string) {
  if (!input.items || input.items.length === 0)
    return { ok: false as const, error: "حدد كميات الاستلام" };
  for (const item of input.items) {
    const qty = Math.floor(item.quantity);
    if (!Number.isFinite(qty) || qty <= 0)
      return { ok: false as const, error: `كمية غير صالحة للبند ${item.itemId}` };
  }
  const now = new Date().toISOString();
  let purchaseId = "";
  try {
    db.transaction((tx) => {
      for (const item of input.items) {
        const row = tx
          .select()
          .from(purchaseItems)
          .where(eq(purchaseItems.id, item.itemId))
          .limit(1)
          .all()[0];
        if (!row) throw new Error("ITEM_NOT_FOUND");
        const purchase = tx
          .select()
          .from(purchases)
          .where(eq(purchases.id, row.purchaseId))
          .limit(1)
          .all()[0];
        if (!purchase || purchase.status === "cancelled")
          throw new Error("PURCHASE_CLOSED");
        purchaseId = purchase.id;
        const newReceived = Math.min(
          row.receivedQuantity + Math.floor(item.quantity),
          row.quantity,
        );
        tx.update(purchaseItems)
          .set({ receivedQuantity: newReceived })
          .where(eq(purchaseItems.id, item.itemId))
          .run();
        if (newReceived > row.receivedQuantity) {
          const stockRow = tx
            .select({ quantity: stocks.quantity })
            .from(stocks)
            .where(
              and(eq(stocks.productId, row.productId), eq(stocks.warehouseId, "wh_main")),
            )
            .limit(1)
            .all()[0];
          const current = stockRow?.quantity ?? 0;
          if (stockRow) {
            tx.update(stocks)
              .set({
                quantity: current + (newReceived - row.receivedQuantity),
                updatedAt: now,
              })
              .where(
                and(
                  eq(stocks.productId, row.productId),
                  eq(stocks.warehouseId, "wh_main"),
                ),
              )
              .run();
          } else {
            tx.insert(stocks)
              .values({
                id: uid("stock"),
                productId: row.productId,
                warehouseId: "wh_main",
                quantity: newReceived - row.receivedQuantity,
              })
              .run();
          }
          tx.insert(stockMovements)
            .values({
              id: `mov_${randomUUID().slice(0, 8)}`,
              productId: row.productId,
              warehouseId: "wh_main",
              quantity: newReceived - row.receivedQuantity,
              type: "PURCHASE",
              referenceType: "purchase",
              referenceId: purchase.id,
              reason: null,
              userId,
            })
            .run();
        }
      }
      const allItems = tx
        .select()
        .from(purchaseItems)
        .where(eq(purchaseItems.purchaseId, purchaseId))
        .all();
      if (
        allItems.length > 0 &&
        allItems.every((i) => i.receivedQuantity >= i.quantity)
      ) {
        tx.update(purchases)
          .set({ status: "received", updatedAt: now })
          .where(eq(purchases.id, purchaseId))
          .run();
      }
    });
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === "ITEM_NOT_FOUND" || err.message === "PURCHASE_CLOSED")
    )
      return {
        ok: false as const,
        error: err.message === "ITEM_NOT_FOUND" ? "البند غير موجود" : "أمر الشراء مغلق",
      };
    throw err;
  }
  const pur = await db
    .select({ orderNumber: purchases.orderNumber })
    .from(purchases)
    .where(eq(purchases.id, purchaseId))
    .limit(1)
    .then((r) => r[0]);
  await logAudit({
    userId,
    action: "receive",
    resource: "purchases",
    resourceId: purchaseId,
    details: `استلام امر شراء #${pur?.orderNumber}`,
  });
  return { ok: true as const };
}

export async function cancelPurchase(id: string, userId: string) {
  const row = await db
    .select()
    .from(purchases)
    .where(eq(purchases.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!row) return { ok: false as const, error: "أمر الشراء غير موجود" };
  if (row.status === "cancelled") return { ok: false as const, error: "ملغي بالفعل" };
  if (row.status === "received")
    return { ok: false as const, error: "لا يمكن إلغاء أمر مستلم بالكامل" };
  await db
    .update(purchases)
    .set({ status: "cancelled", updatedAt: new Date().toISOString() })
    .where(eq(purchases.id, id))
    .run();
  await logAudit({
    userId,
    action: "cancel",
    resource: "purchases",
    resourceId: id,
    details: `إلغاء امر شراء #${row.orderNumber}`,
  });
  return { ok: true as const };
}

export async function getPurchaseStats() {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db
    .select({
      total: purchases.total,
      status: purchases.status,
      createdAt: purchases.createdAt,
    })
    .from(purchases);
  const valid = rows.filter((r) => r.status !== "cancelled");
  const todayRows = valid.filter((r) => r.createdAt.slice(0, 10) === today);
  const sum = (rs: typeof valid) => rs.reduce((s, r) => s + r.total, 0);
  return {
    todayTotal: sum(todayRows),
    todayCount: todayRows.length,
    totalValue: sum(valid),
    totalCount: valid.length,
  };
}
