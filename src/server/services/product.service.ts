import { randomUUID } from "crypto";
import { and, asc, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { categories, products, units } from "@/server/db/schema";
import { uid } from "@/server/db/factories";
import { logAudit } from "./audit.service";
import { listCategories } from "./category.service";
import { listUnits } from "./unit.service";

export interface ProductListFilter {
  search?: string;
  categoryId?: string;
}

export async function listProducts(filter: ProductListFilter = {}) {
  const conditions = [isNull(products.deletedAt)];
  if (filter.categoryId) {
    conditions.push(eq(products.categoryId, filter.categoryId));
  }
  if (filter.search) {
    // Escape LIKE wildcards so user input matches literally.
    const escaped = `%${filter.search.trim().replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
    conditions.push(
      sql`(${products.name} LIKE ${escaped} ESCAPE '\\' OR ${products.code} LIKE ${escaped} ESCAPE '\\')`,
    );
  }
  return db
    .select({
      id: products.id,
      code: products.code,
      name: products.name,
      description: products.description,
      categoryId: products.categoryId,
      categoryName: categories.name,
      unitId: products.unitId,
      unitName: units.name,
      buyPrice: products.buyPrice,
      retailPrice: products.retailPrice,
      wholesalePrice: products.wholesalePrice,
      minLevel: products.minLevel,
      isActive: products.isActive,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(units, eq(products.unitId, units.id))
    .where(and(...conditions))
    .orderBy(asc(products.name));
}

export async function getProduct(id: string) {
  const rows = await db
    .select({
      id: products.id,
      code: products.code,
      name: products.name,
      description: products.description,
      categoryId: products.categoryId,
      categoryName: categories.name,
      unitId: products.unitId,
      unitName: units.name,
      buyPrice: products.buyPrice,
      retailPrice: products.retailPrice,
      wholesalePrice: products.wholesalePrice,
      specialPrice: products.specialPrice,
      minProfitMargin: products.minProfitMargin,
      minLevel: products.minLevel,
      isActive: products.isActive,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(units, eq(products.unitId, units.id))
    .where(and(eq(products.id, id), isNull(products.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

export interface CreateProductInput {
  code: string;
  name: string;
  description?: string | null;
  categoryId?: string | null;
  unitId?: string | null;
  buyPrice: number;
  retailPrice: number;
  wholesalePrice?: number | null;
  specialPrice?: number | null;
  minLevel?: number | null;
}

export async function createProduct(input: CreateProductInput, userId?: string) {
  const code = input.code.trim();
  const name = input.name.trim();
  if (!code) return { ok: false as const, error: "رمز المنتج مطلوب" };
  if (!name) return { ok: false as const, error: "اسم المنتج مطلوب" };
  if (input.buyPrice < 0 || input.retailPrice < 0) {
    return { ok: false as const, error: "الأسعار يجب أن تكون صفراً أو أكثر" };
  }
  const existing = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.code, code), isNull(products.deletedAt)))
    .limit(1);
  if (existing.length > 0)
    return { ok: false as const, error: "رمز المنتج موجود مسبقاً" };

  if (input.categoryId) {
    const cat = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, input.categoryId))
      .limit(1);
    if (!cat[0]) return { ok: false as const, error: "الفئة غير موجودة" };
  }
  if (input.unitId) {
    const unit = await db
      .select({ id: units.id })
      .from(units)
      .where(eq(units.id, input.unitId))
      .limit(1);
    if (!unit[0]) return { ok: false as const, error: "الوحدة غير موجودة" };
  }

  const id = uid("prod");
  await db.insert(products).values({
    id,
    code,
    name,
    description: input.description?.trim() || null,
    categoryId: input.categoryId ?? null,
    unitId: input.unitId ?? null,
    buyPrice: input.buyPrice,
    retailPrice: input.retailPrice,
    wholesalePrice: input.wholesalePrice ?? null,
    specialPrice: input.specialPrice ?? null,
    minLevel: input.minLevel ?? 5,
    isActive: true,
  });
  await logAudit({ userId, action: "create", resource: "products", resourceId: id });
  return { ok: true as const, id };
}

export async function updateProduct(
  id: string,
  input: Partial<CreateProductInput> & { isActive?: boolean },
  userId?: string,
) {
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, id), isNull(products.deletedAt)))
    .limit(1);
  if (!rows[0]) return { ok: false as const, error: "المنتج غير موجود" };

  const patch: Partial<typeof products.$inferInsert> = {};
  if (input.code !== undefined) {
    const code = input.code.trim();
    if (!code) return { ok: false as const, error: "رمز المنتج مطلوب" };
    const clash = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.code, code), isNull(products.deletedAt)))
      .limit(1);
    if (clash.length > 0 && clash[0].id !== id) {
      return { ok: false as const, error: "رمز المنتج موجود مسبقاً" };
    }
    patch.code = code;
  }
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) return { ok: false as const, error: "اسم المنتج مطلوب" };
    patch.name = name;
  }
  if (input.description !== undefined)
    patch.description = input.description?.trim() || null;
  if (input.categoryId !== undefined) patch.categoryId = input.categoryId;
  if (input.unitId !== undefined) patch.unitId = input.unitId;
  for (const key of [
    "buyPrice",
    "retailPrice",
    "wholesalePrice",
    "specialPrice",
  ] as const) {
    if (input[key] !== undefined && input[key] !== null && input[key]! < 0) {
      return { ok: false as const, error: "الأسعار يجب أن تكون صفراً أو أكثر" };
    }
    if (input[key] !== undefined) (patch as Record<string, unknown>)[key] = input[key];
  }
  if (input.minLevel !== undefined) patch.minLevel = input.minLevel;
  if (input.isActive !== undefined) patch.isActive = input.isActive;

  if (Object.keys(patch).length > 0) {
    await db.update(products).set(patch).where(eq(products.id, id));
  }
  await logAudit({ userId, action: "update", resource: "products", resourceId: id });
  return { ok: true as const };
}

export async function deleteProduct(id: string, userId?: string) {
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, id), isNull(products.deletedAt)))
    .limit(1);
  if (!rows[0]) return { ok: false as const, error: "المنتج غير موجود" };
  await db
    .update(products)
    .set({ deletedAt: new Date().toISOString(), isActive: false })
    .where(eq(products.id, id));
  await logAudit({ userId, action: "delete", resource: "products", resourceId: id });
  return { ok: true as const };
}

export async function getProductsMetadata() {
  const [cats, unitRows] = await Promise.all([listCategories(), listUnits()]);
  return { categories: cats, units: unitRows };
}

export function suggestProductCode(): string {
  return `P-${randomUUID().slice(0, 4).toUpperCase()}`;
}
