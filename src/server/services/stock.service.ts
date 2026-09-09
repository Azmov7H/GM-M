import { randomUUID } from "crypto";
import { and, asc, desc, eq, type SQL } from "drizzle-orm";

import { db } from "@/server/db";
import {
  products,
  stocks,
  stockMovements,
  stockTransfers,
  users,
  warehouses,
} from "@/server/db/schema";
import { uid } from "@/server/db/factories";
import { logAudit } from "./audit.service";

export interface StockLevelFilter {
  warehouseId?: string;
  lowOnly?: boolean;
  search?: string;
}

export async function getStockLevels(filter: StockLevelFilter = {}) {
  const conditions: SQL[] = [];
  if (filter.warehouseId) {
    conditions.push(eq(stocks.warehouseId, filter.warehouseId));
  }
  const base = db
    .select({
      productId: products.id,
      productCode: products.code,
      productName: products.name,
      minLevel: products.minLevel,
      warehouseId: warehouses.id,
      warehouseName: warehouses.name,
      quantity: stocks.quantity,
      updatedAt: stocks.updatedAt,
    })
    .from(stocks)
    .innerJoin(products, eq(stocks.productId, products.id))
    .innerJoin(warehouses, eq(stocks.warehouseId, warehouses.id))
    .orderBy(asc(products.name), asc(warehouses.name));
  const rows = conditions.length > 0 ? await base.where(and(...conditions)) : await base;

  let levels = rows.map((r) => ({
    ...r,
    minLevel: r.minLevel ?? 5,
    isLow: r.quantity <= (r.minLevel ?? 5),
  }));
  if (filter.lowOnly) levels = levels.filter((l) => l.isLow);
  if (filter.search) {
    const q = filter.search.trim().toLowerCase();
    levels = levels.filter(
      (l) =>
        l.productName.toLowerCase().includes(q) ||
        l.productCode.toLowerCase().includes(q),
    );
  }
  return levels;
}

export async function getProductStock(productId: string) {
  return db
    .select({
      warehouseId: warehouses.id,
      warehouseName: warehouses.name,
      quantity: stocks.quantity,
      updatedAt: stocks.updatedAt,
    })
    .from(stocks)
    .innerJoin(warehouses, eq(stocks.warehouseId, warehouses.id))
    .where(eq(stocks.productId, productId))
    .orderBy(asc(warehouses.name));
}

export async function listWarehouses() {
  return db.select().from(warehouses).orderBy(asc(warehouses.name));
}

export interface TransferInput {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  userId: string;
  notes?: string | null;
}

export async function transferStock(input: TransferInput) {
  const qty = Math.floor(input.quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    return { ok: false as const, error: "الكمية يجب أن تكون عدداً صحيحاً موجباً" };
  }
  if (input.fromWarehouseId === input.toWarehouseId) {
    return { ok: false as const, error: "مخزن المصدر والوجهة يجب أن يكونا مختلفين" };
  }

  const product = await db
    .select({ id: products.id, name: products.name })
    .from(products)
    .where(eq(products.id, input.productId))
    .limit(1)
    .then((r) => r[0]);
  if (!product) return { ok: false as const, error: "المنتج غير موجود" };

  const transferId = uid("trf");
  const now = new Date().toISOString();

  try {
    db.transaction((tx) => {
      const source = tx
        .select({ quantity: stocks.quantity })
        .from(stocks)
        .where(
          and(
            eq(stocks.productId, input.productId),
            eq(stocks.warehouseId, input.fromWarehouseId),
          ),
        )
        .limit(1)
        .all()[0];
      const sourceQty = source?.quantity ?? 0;
      if (sourceQty < qty) {
        throw new Error("INSUFFICIENT_STOCK");
      }
      tx.update(stocks)
        .set({ quantity: sourceQty - qty, updatedAt: now })
        .where(
          and(
            eq(stocks.productId, input.productId),
            eq(stocks.warehouseId, input.fromWarehouseId),
          ),
        )
        .run();

      const dest = tx
        .select({ quantity: stocks.quantity })
        .from(stocks)
        .where(
          and(
            eq(stocks.productId, input.productId),
            eq(stocks.warehouseId, input.toWarehouseId),
          ),
        )
        .limit(1)
        .all()[0];
      if (dest) {
        tx.update(stocks)
          .set({ quantity: dest.quantity + qty, updatedAt: now })
          .where(
            and(
              eq(stocks.productId, input.productId),
              eq(stocks.warehouseId, input.toWarehouseId),
            ),
          )
          .run();
      } else {
        tx.insert(stocks)
          .values({
            id: `stock_${randomUUID().slice(0, 8)}`,
            productId: input.productId,
            warehouseId: input.toWarehouseId,
            quantity: qty,
            updatedAt: now,
          })
          .run();
      }

      tx.insert(stockTransfers)
        .values({
          id: transferId,
          fromWarehouseId: input.fromWarehouseId,
          toWarehouseId: input.toWarehouseId,
          productId: input.productId,
          quantity: qty,
          userId: input.userId,
          notes: input.notes?.trim() || null,
        })
        .run();

      const movementId = () => `mov_${randomUUID().slice(0, 8)}`;
      tx.insert(stockMovements)
        .values({
          id: movementId(),
          productId: input.productId,
          warehouseId: input.fromWarehouseId,
          quantity: -qty,
          type: "TRANSFER",
          referenceType: "transfer",
          referenceId: transferId,
          reason: input.notes?.trim() || null,
          userId: input.userId,
        })
        .run();
      tx.insert(stockMovements)
        .values({
          id: movementId(),
          productId: input.productId,
          warehouseId: input.toWarehouseId,
          quantity: qty,
          type: "TRANSFER",
          referenceType: "transfer",
          referenceId: transferId,
          reason: input.notes?.trim() || null,
          userId: input.userId,
        })
        .run();
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_STOCK") {
      return { ok: false as const, error: "الكمية المتاحة في مخزن المصدر غير كافية" };
    }
    throw err;
  }

  await logAudit({
    userId: input.userId,
    action: "transfer",
    resource: "stock",
    resourceId: transferId,
    details: `${product.name}: ${qty} من ${input.fromWarehouseId} إلى ${input.toWarehouseId}`,
  });
  return { ok: true as const, id: transferId };
}

export interface AdjustInput {
  productId: string;
  warehouseId: string;
  quantity: number;
  reason: string;
  userId: string;
}

export async function adjustStock(input: AdjustInput) {
  const qty = Math.floor(input.quantity);
  if (!Number.isFinite(qty) || qty < 0) {
    return { ok: false as const, error: "الكمية يجب أن تكون صفراً أو أكثر" };
  }
  const reason = input.reason.trim();
  if (!reason) return { ok: false as const, error: "سبب التسوية مطلوب" };

  const product = await db
    .select({ id: products.id, name: products.name })
    .from(products)
    .where(eq(products.id, input.productId))
    .limit(1)
    .then((r) => r[0]);
  if (!product) return { ok: false as const, error: "المنتج غير موجود" };

  const now = new Date().toISOString();
  const movementId = `mov_${randomUUID().slice(0, 8)}`;

  db.transaction((tx) => {
    const existing = tx
      .select({ quantity: stocks.quantity })
      .from(stocks)
      .where(
        and(
          eq(stocks.productId, input.productId),
          eq(stocks.warehouseId, input.warehouseId),
        ),
      )
      .limit(1)
      .all()[0];
    if (existing) {
      tx.update(stocks)
        .set({ quantity: qty, updatedAt: now })
        .where(
          and(
            eq(stocks.productId, input.productId),
            eq(stocks.warehouseId, input.warehouseId),
          ),
        )
        .run();
    } else {
      tx.insert(stocks)
        .values({
          id: `stock_${randomUUID().slice(0, 8)}`,
          productId: input.productId,
          warehouseId: input.warehouseId,
          quantity: qty,
          updatedAt: now,
        })
        .run();
    }
    tx.insert(stockMovements)
      .values({
        id: movementId,
        productId: input.productId,
        warehouseId: input.warehouseId,
        quantity: qty,
        type: "ADJUST",
        referenceType: "adjust",
        referenceId: movementId,
        reason,
        userId: input.userId,
      })
      .run();
  });

  await logAudit({
    userId: input.userId,
    action: "adjust",
    resource: "stock",
    resourceId: movementId,
    details: `${product.name}: تسوية إلى ${qty} — ${reason}`,
  });
  return { ok: true as const, id: movementId };
}

export interface MovementFilter {
  productId?: string;
  warehouseId?: string;
  type?: string;
  limit?: number;
}

export async function listMovements(filter: MovementFilter = {}) {
  const conditions = [];
  if (filter.productId) conditions.push(eq(stockMovements.productId, filter.productId));
  if (filter.warehouseId)
    conditions.push(eq(stockMovements.warehouseId, filter.warehouseId));
  if (filter.type) conditions.push(eq(stockMovements.type, filter.type));
  const qb = db
    .select({
      id: stockMovements.id,
      productId: stockMovements.productId,
      productName: products.name,
      productCode: products.code,
      warehouseId: stockMovements.warehouseId,
      warehouseName: warehouses.name,
      quantity: stockMovements.quantity,
      type: stockMovements.type,
      referenceType: stockMovements.referenceType,
      referenceId: stockMovements.referenceId,
      reason: stockMovements.reason,
      userName: users.displayName,
      createdAt: stockMovements.createdAt,
    })
    .from(stockMovements)
    .leftJoin(products, eq(stockMovements.productId, products.id))
    .leftJoin(warehouses, eq(stockMovements.warehouseId, warehouses.id))
    .leftJoin(users, eq(stockMovements.userId, users.id))
    .orderBy(desc(stockMovements.createdAt));
  if (conditions.length > 0) {
    return qb.where(and(...conditions)).limit(filter.limit ?? 200);
  }
  return qb.limit(filter.limit ?? 200);
}

export async function getLowStockCount(): Promise<number> {
  const rows = await db
    .select({ quantity: stocks.quantity, minLevel: products.minLevel })
    .from(stocks)
    .innerJoin(products, eq(stocks.productId, products.id));
  return rows.filter((r) => r.quantity <= (r.minLevel ?? 5)).length;
}
