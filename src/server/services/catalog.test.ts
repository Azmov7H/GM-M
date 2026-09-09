import { describe, it, expect, vi } from "vitest";

vi.mock("@/server/db", async () => {
  const { createTestDb } = await import("@/server/db/test-db");
  return { db: createTestDb() };
});

import { db } from "@/server/db";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProductsMetadata,
  listProducts,
  updateProduct,
} from "./product.service";
import { createCategory, deleteCategory, listCategories } from "./category.service";
import { createUnit, deleteUnit } from "./unit.service";
import {
  createCategory as mkCategory,
  createUnit as mkUnit,
  createUser as mkUser,
} from "@/server/db/factories";
import { hashPassword } from "@/lib/auth/password";

describe("catalog services", () => {
  it("creates, lists, and fetches a product", async () => {
    const auditor = await mkUser(db, {
      username: `audit_${Math.random().toString(36).slice(2, 8)}`,
      passwordHash: await hashPassword("secret123"),
    });
    const cat = await mkCategory(db, { name: "فئة اختبار" });
    const unit = await mkUnit(db, { name: "علبة اختبار", nameShort: "علبة" });
    const created = await createProduct(
      {
        code: `T-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        name: "منتج اختبار",
        categoryId: cat.id,
        unitId: unit.id,
        buyPrice: 10,
        retailPrice: 15,
      },
      auditor.id,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const fetched = await getProduct(created.id);
    expect(fetched?.name).toBe("منتج اختبار");
    expect(fetched?.categoryName).toBe("فئة اختبار");

    const listed = await listProducts({ search: "اختبار" });
    expect(listed.some((p) => p.id === created.id)).toBe(true);
  });

  it("rejects duplicate product codes", async () => {
    const code = `DUP-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const first = await createProduct({
      code,
      name: "الأول",
      buyPrice: 1,
      retailPrice: 2,
    });
    expect(first.ok).toBe(true);
    const second = await createProduct({
      code,
      name: "الثاني",
      buyPrice: 1,
      retailPrice: 2,
    });
    expect(second.ok).toBe(false);
  });

  it("updates and soft-deletes products", async () => {
    const code = `DEL-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const created = await createProduct({
      code,
      name: "للحذف",
      buyPrice: 1,
      retailPrice: 2,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await updateProduct(created.id, { retailPrice: 99 });
    expect(updated.ok).toBe(true);
    expect((await getProduct(created.id))?.retailPrice).toBe(99);

    const deleted = await deleteProduct(created.id);
    expect(deleted.ok).toBe(true);
    expect(await getProduct(created.id)).toBeNull();
    expect((await listProducts({})).some((p) => p.id === created.id)).toBe(false);
  });

  it("blocks deleting categories and units in use", async () => {
    const cat = await createCategory({ name: "فئة مستخدمة" });
    expect(cat.ok).toBe(true);
    if (!cat.ok) return;
    const unit = await createUnit({ name: "وحدة مستخدمة", nameShort: "و" });
    expect(unit.ok).toBe(true);
    if (!unit.ok) return;

    await createProduct({
      code: `U-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      name: "منتج مرتبط",
      categoryId: cat.id,
      unitId: unit.id,
      buyPrice: 1,
      retailPrice: 2,
    });

    expect((await deleteCategory(cat.id)).ok).toBe(false);
    expect((await deleteUnit(unit.id)).ok).toBe(false);

    const emptyCat = await createCategory({ name: "فئة فارغة" });
    expect(emptyCat.ok).toBe(true);
    if (emptyCat.ok) {
      expect((await deleteCategory(emptyCat.id)).ok).toBe(true);
    }
    expect((await listCategories()).length).toBeGreaterThan(0);
  });

  it("returns metadata for product forms", async () => {
    const meta = await getProductsMetadata();
    expect(Array.isArray(meta.categories)).toBe(true);
    expect(Array.isArray(meta.units)).toBe(true);
  });
});
