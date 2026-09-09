import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "@/server/db";
import { products, units } from "@/server/db/schema";
import { uid } from "@/server/db/factories";
import { logAudit } from "./audit.service";

export async function listUnits() {
  return db.select().from(units).orderBy(asc(units.name));
}

export async function createUnit(
  input: { name: string; nameShort: string },
  userId?: string,
) {
  const name = input.name.trim();
  const nameShort = input.nameShort.trim();
  if (!name || !nameShort)
    return { ok: false as const, error: "اسم الوحدة ومختصرها مطلوبان" };
  const existing = await db
    .select({ id: units.id })
    .from(units)
    .where(eq(units.name, name))
    .limit(1);
  if (existing.length > 0) return { ok: false as const, error: "الوحدة موجودة مسبقاً" };
  const id = uid("unit");
  await db.insert(units).values({ id, name, nameShort });
  await logAudit({ userId, action: "create", resource: "units", resourceId: id });
  return { ok: true as const, id };
}

export async function updateUnit(
  id: string,
  input: { name?: string; nameShort?: string },
  userId?: string,
) {
  const rows = await db.select().from(units).where(eq(units.id, id)).limit(1);
  if (!rows[0]) return { ok: false as const, error: "الوحدة غير موجودة" };
  const patch: Partial<typeof units.$inferInsert> = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) return { ok: false as const, error: "اسم الوحدة مطلوب" };
    patch.name = name;
  }
  if (input.nameShort !== undefined) {
    const nameShort = input.nameShort.trim();
    if (!nameShort) return { ok: false as const, error: "مختصر الوحدة مطلوب" };
    patch.nameShort = nameShort;
  }
  if (Object.keys(patch).length > 0) {
    await db.update(units).set(patch).where(eq(units.id, id));
  }
  await logAudit({ userId, action: "update", resource: "units", resourceId: id });
  return { ok: true as const };
}

export async function deleteUnit(id: string, userId?: string) {
  const rows = await db.select().from(units).where(eq(units.id, id)).limit(1);
  if (!rows[0]) return { ok: false as const, error: "الوحدة غير موجودة" };
  const used = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.unitId, id), isNull(products.deletedAt)))
    .limit(1);
  if (used.length > 0) {
    return { ok: false as const, error: "لا يمكن حذف وحدة مرتبطة بمنتجات" };
  }
  await db.delete(units).where(eq(units.id, id));
  await logAudit({ userId, action: "delete", resource: "units", resourceId: id });
  return { ok: true as const };
}
