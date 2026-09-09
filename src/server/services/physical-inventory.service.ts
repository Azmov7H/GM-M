import { randomUUID } from "crypto";
import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/server/db";
import {
  physicalInventories,
  physicalInventoryItems,
  products,
  stocks,
  stockMovements,
  warehouses,
} from "@/server/db/schema";
import { uid } from "@/server/db/factories";
import { logAudit } from "./audit.service";

const ACTIVE_STATUSES = ["draft", "counting"];

export async function listCounts() {
  return db
    .select({
      id: physicalInventories.id,
      name: physicalInventories.name,
      status: physicalInventories.status,
      warehouseId: physicalInventories.warehouseId,
      warehouseName: warehouses.name,
      notes: physicalInventories.notes,
      createdAt: physicalInventories.createdAt,
    })
    .from(physicalInventories)
    .leftJoin(warehouses, eq(physicalInventories.warehouseId, warehouses.id))
    .orderBy(desc(physicalInventories.createdAt));
}

export async function createCount(input: {
  name: string;
  warehouseId?: string | null;
  userId: string;
  notes?: string | null;
}) {
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "اسم الجرد مطلوب" };

  const active = await db
    .select({ id: physicalInventories.id })
    .from(physicalInventories)
    .where(inArray(physicalInventories.status, ACTIVE_STATUSES))
    .limit(1);
  if (active.length > 0) {
    return { ok: false as const, error: "توجد جلسة جرد نشطة. أكملها أو ألغها أولاً" };
  }

  if (input.warehouseId) {
    const wh = await db
      .select({ id: warehouses.id })
      .from(warehouses)
      .where(eq(warehouses.id, input.warehouseId))
      .limit(1);
    if (!wh[0]) return { ok: false as const, error: "المخزن غير موجود" };
  }

  const stockRows = await db
    .select({
      productId: stocks.productId,
      warehouseId: stocks.warehouseId,
      quantity: stocks.quantity,
    })
    .from(stocks);
  const relevant = input.warehouseId
    ? stockRows.filter((r) => r.warehouseId === input.warehouseId)
    : stockRows;
  if (relevant.length === 0) {
    return { ok: false as const, error: "لا يوجد مخزون لجرده" };
  }

  const id = uid("pi");
  const now = new Date().toISOString();
  db.transaction((tx) => {
    tx.insert(physicalInventories)
      .values({
        id,
        name,
        status: "counting",
        warehouseId: input.warehouseId ?? null,
        userId: input.userId,
        notes: input.notes?.trim() || null,
      })
      .run();
    for (const row of relevant) {
      tx.insert(physicalInventoryItems)
        .values({
          id: `pii_${randomUUID().slice(0, 8)}`,
          physicalInventoryId: id,
          productId: row.productId,
          systemQuantity: row.quantity,
          countedQuantity: null,
          variance: null,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }
  });

  await logAudit({
    userId: input.userId,
    action: "create",
    resource: "physical_inventory",
    resourceId: id,
  });
  return { ok: true as const, id };
}

export async function getCount(id: string) {
  const header = await db
    .select({
      id: physicalInventories.id,
      name: physicalInventories.name,
      status: physicalInventories.status,
      warehouseId: physicalInventories.warehouseId,
      warehouseName: warehouses.name,
      notes: physicalInventories.notes,
      createdAt: physicalInventories.createdAt,
    })
    .from(physicalInventories)
    .leftJoin(warehouses, eq(physicalInventories.warehouseId, warehouses.id))
    .where(eq(physicalInventories.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!header) return null;
  const items = await db
    .select({
      id: physicalInventoryItems.id,
      productId: physicalInventoryItems.productId,
      productName: products.name,
      productCode: products.code,
      systemQuantity: physicalInventoryItems.systemQuantity,
      countedQuantity: physicalInventoryItems.countedQuantity,
      variance: physicalInventoryItems.variance,
    })
    .from(physicalInventoryItems)
    .leftJoin(products, eq(physicalInventoryItems.productId, products.id))
    .where(eq(physicalInventoryItems.physicalInventoryId, id))
    .orderBy(asc(products.name));
  return { ...header, items };
}

export async function updateCounts(
  id: string,
  counts: { itemId: string; countedQuantity: number }[],
  userId?: string,
) {
  const header = await db
    .select({ status: physicalInventories.status })
    .from(physicalInventories)
    .where(eq(physicalInventories.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!header) return { ok: false as const, error: "جلسة الجرد غير موجودة" };
  if (!ACTIVE_STATUSES.includes(header.status)) {
    return { ok: false as const, error: "لا يمكن تعديل جلسة مكتملة أو معتمدة" };
  }
  for (const c of counts) {
    const qty = Math.floor(c.countedQuantity);
    if (!Number.isFinite(qty) || qty < 0) {
      return { ok: false as const, error: "الكميات المحسوبة يجب أن تكون صفراً أو أكثر" };
    }
  }
  const now = new Date().toISOString();
  db.transaction((tx) => {
    for (const c of counts) {
      const item = tx
        .select({
          systemQuantity: physicalInventoryItems.systemQuantity,
        })
        .from(physicalInventoryItems)
        .where(
          and(
            eq(physicalInventoryItems.id, c.itemId),
            eq(physicalInventoryItems.physicalInventoryId, id),
          ),
        )
        .limit(1)
        .all()[0];
      if (!item) continue;
      const qty = Math.floor(c.countedQuantity);
      tx.update(physicalInventoryItems)
        .set({
          countedQuantity: qty,
          variance: qty - item.systemQuantity,
          updatedAt: now,
        })
        .where(eq(physicalInventoryItems.id, c.itemId))
        .run();
    }
    if (header.status === "draft") {
      tx.update(physicalInventories)
        .set({ status: "counting", updatedAt: now })
        .where(eq(physicalInventories.id, id))
        .run();
    }
  });
  await logAudit({
    userId,
    action: "update",
    resource: "physical_inventory",
    resourceId: id,
  });
  return { ok: true as const };
}

export async function completeCount(id: string, userId?: string) {
  const header = await db
    .select({ status: physicalInventories.status })
    .from(physicalInventories)
    .where(eq(physicalInventories.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!header) return { ok: false as const, error: "جلسة الجرد غير موجودة" };
  if (!ACTIVE_STATUSES.includes(header.status)) {
    return { ok: false as const, error: "الجلسة مكتملة أو معتمدة مسبقاً" };
  }
  const items = await db
    .select({
      id: physicalInventoryItems.id,
      countedQuantity: physicalInventoryItems.countedQuantity,
    })
    .from(physicalInventoryItems)
    .where(eq(physicalInventoryItems.physicalInventoryId, id));
  if (items.some((i) => i.countedQuantity === null)) {
    return {
      ok: false as const,
      error: "يجب إدخال الكميات المحسوبة لجميع الأصناف أولاً",
    };
  }
  await db
    .update(physicalInventories)
    .set({ status: "completed", updatedAt: new Date().toISOString() })
    .where(eq(physicalInventories.id, id));
  await logAudit({
    userId,
    action: "complete",
    resource: "physical_inventory",
    resourceId: id,
  });
  return { ok: true as const };
}

export async function approveCount(id: string, userId: string) {
  const header = await db
    .select({
      status: physicalInventories.status,
      warehouseId: physicalInventories.warehouseId,
    })
    .from(physicalInventories)
    .where(eq(physicalInventories.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!header) return { ok: false as const, error: "جلسة الجرد غير موجودة" };
  if (header.status !== "completed") {
    return { ok: false as const, error: "يجب إكمال الجرد قبل اعتماده" };
  }
  const now = new Date().toISOString();
  const items = await db
    .select()
    .from(physicalInventoryItems)
    .where(eq(physicalInventoryItems.physicalInventoryId, id));
  const adjusted = items.filter(
    (i) => i.countedQuantity !== null && i.countedQuantity !== i.systemQuantity,
  );

  db.transaction((tx) => {
    for (const item of adjusted) {
      const targetWh =
        header.warehouseId ??
        tx
          .select({ warehouseId: stocks.warehouseId })
          .from(stocks)
          .where(eq(stocks.productId, item.productId))
          .limit(1)
          .all()[0]?.warehouseId;
      if (!targetWh) continue;
      const existing = tx
        .select({ quantity: stocks.quantity })
        .from(stocks)
        .where(
          and(eq(stocks.productId, item.productId), eq(stocks.warehouseId, targetWh)),
        )
        .limit(1)
        .all()[0];
      if (existing) {
        tx.update(stocks)
          .set({ quantity: item.countedQuantity!, updatedAt: now })
          .where(
            and(eq(stocks.productId, item.productId), eq(stocks.warehouseId, targetWh)),
          )
          .run();
      } else {
        tx.insert(stocks)
          .values({
            id: `stock_${randomUUID().slice(0, 8)}`,
            productId: item.productId,
            warehouseId: targetWh,
            quantity: item.countedQuantity!,
            updatedAt: now,
          })
          .run();
      }
      const movementId = `mov_${randomUUID().slice(0, 8)}`;
      tx.insert(stockMovements)
        .values({
          id: movementId,
          productId: item.productId,
          warehouseId: targetWh,
          quantity: item.countedQuantity!,
          type: "ADJUST",
          referenceType: "physical_inventory",
          referenceId: id,
          reason: `اعتماد جرد ${id}`,
          userId,
        })
        .run();
    }
    tx.update(physicalInventories)
      .set({ status: "approved", updatedAt: now })
      .where(eq(physicalInventories.id, id))
      .run();
  });

  await logAudit({
    userId,
    action: "approve",
    resource: "physical_inventory",
    resourceId: id,
    details: `تمت تسوية ${adjusted.length} صنف`,
  });
  return { ok: true as const, adjusted: adjusted.length };
}

export async function cancelCount(id: string, userId?: string) {
  const header = await db
    .select({ status: physicalInventories.status })
    .from(physicalInventories)
    .where(eq(physicalInventories.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!header) return { ok: false as const, error: "جلسة الجرد غير موجودة" };
  if (!ACTIVE_STATUSES.includes(header.status)) {
    return { ok: false as const, error: "لا يمكن إلغاء جلسة مكتملة أو معتمدة" };
  }
  await db
    .update(physicalInventories)
    .set({ status: "cancelled", updatedAt: new Date().toISOString() })
    .where(eq(physicalInventories.id, id));
  await logAudit({
    userId,
    action: "cancel",
    resource: "physical_inventory",
    resourceId: id,
  });
  return { ok: true as const };
}
