import { randomUUID } from "crypto";
import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "@/server/db";
import { categories, products } from "@/server/db/schema";
import { uid } from "@/server/db/factories";
import { logAudit } from "./audit.service";

export async function listCategories() {
  return db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function createCategory(
  input: { name: string; parentId?: string | null; sortOrder?: number },
  userId?: string,
) {
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "اسم الفئة مطلوب" };
  if (input.parentId) {
    const parent = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, input.parentId))
      .limit(1);
    if (!parent[0]) return { ok: false as const, error: "الفئة الأب غير موجودة" };
  }
  const id = uid("cat");
  await db.insert(categories).values({
    id,
    name,
    parentId: input.parentId ?? null,
    sortOrder: input.sortOrder ?? 0,
  });
  await logAudit({ userId, action: "create", resource: "categories", resourceId: id });
  return { ok: true as const, id };
}

export async function updateCategory(
  id: string,
  input: { name?: string; parentId?: string | null; sortOrder?: number },
  userId?: string,
) {
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!rows[0]) return { ok: false as const, error: "الفئة غير موجودة" };
  if (input.parentId === id) {
    return { ok: false as const, error: "لا يمكن أن تكون الفئة أباً لنفسها" };
  }
  const patch: Partial<typeof categories.$inferInsert> = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) return { ok: false as const, error: "اسم الفئة مطلوب" };
    patch.name = name;
  }
  if (input.parentId !== undefined) patch.parentId = input.parentId;
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (Object.keys(patch).length > 0) {
    await db.update(categories).set(patch).where(eq(categories.id, id));
  }
  await logAudit({ userId, action: "update", resource: "categories", resourceId: id });
  return { ok: true as const };
}

export async function deleteCategory(id: string, userId?: string) {
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!rows[0]) return { ok: false as const, error: "الفئة غير موجودة" };
  const children = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.parentId, id))
    .limit(1);
  if (children.length > 0) {
    return { ok: false as const, error: "لا يمكن حذف فئة لها فئات فرعية" };
  }
  const used = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.categoryId, id), isNull(products.deletedAt)))
    .limit(1);
  if (used.length > 0) {
    return { ok: false as const, error: "لا يمكن حذف فئة مرتبطة بمنتجات" };
  }
  await db.delete(categories).where(eq(categories.id, id));
  await logAudit({ userId, action: "delete", resource: "categories", resourceId: id });
  return { ok: true as const };
}

export function newCategoryId(): string {
  return `cat_${randomUUID().slice(0, 8)}`;
}
