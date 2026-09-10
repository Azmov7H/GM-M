import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", async () => {
  const { createTestDb } = await import("@/server/db/test-db");
  return { db: createTestDb() };
});

vi.mock("./audit.service", () => ({
  logAudit: vi.fn(async () => undefined),
}));

import { createCategory, deleteCategory } from "./category.service";
import { createUnit, deleteUnit } from "./unit.service";
import {
  exportProductsCsv,
  importProductsCsv,
  parseCsv,
  serializeProductsCsv,
} from "./product-io.service";
import { createProduct } from "./product.service";

describe("parseCsv", () => {
  it("handles quotes, commas, CRLF and BOM", () => {
    const rows = parseCsv(
      '﻿code,name,description\r\nP1,"قهوة, مختصة","سطر1"\r\nP2,شاي,"مقاس ""كبير"""\r\n',
    );
    expect(rows).toEqual([
      ["code", "name", "description"],
      ["P1", "قهوة, مختصة", "سطر1"],
      ["P2", "شاي", 'مقاس "كبير"'],
    ]);
  });
});

describe("serializeProductsCsv", () => {
  it("emits BOM header and escapes cells", () => {
    const csv = serializeProductsCsv([
      {
        code: "P1",
        name: 'بن "مختص"',
        description: "a,b",
        unitName: "كيس",
        categoryName: null,
        buyPrice: 10,
        retailPrice: 15,
        wholesalePrice: null,
        minLevel: 5,
        isActive: true,
      },
    ]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const lines = csv
      .replace(/^\uFEFF/, "")
      .trim()
      .split("\n");
    expect(lines[0]).toBe(
      "code,name,description,unit,category,buyPrice,retailPrice,wholesalePrice,minLevel,isActive",
    );
    expect(lines[1]).toBe('P1,"بن ""مختص""","a,b",كيس,,10,15,,5,1');
  });
});

describe("importProductsCsv", () => {
  it("imports valid rows and reports per-row errors", async () => {
    const cat = await createCategory({ name: "مشروبات" });
    if (!cat.ok) throw new Error("seed category failed");
    const unit = await createUnit({ name: "علبة", nameShort: "علبة" });
    if (!unit.ok) throw new Error("seed unit failed");

    const csv = [
      "code,name,description,unit,category,buyPrice,retailPrice,wholesalePrice,minLevel,isActive",
      "IMP1,قهوة,مختصة,علبة,مشروبات,10,15,,5,1",
      "IMP2,شاي,,,,5,8,,,0",
      ",بدون رمز,,,,0,0,,,",
      "IMP1,مكرر,,,,0,0,,,",
      "IMP3,وحدة مجهولة,خ,كرتون,,0,0,,,",
      "IMP4,سعر سالب,,,,0,-1,,,",
    ].join("\n");

    const res = await importProductsCsv(csv, "user_1");
    expect(res.total).toBe(6);
    expect(res.imported).toBe(2);
    expect(res.failed).toBe(4);
    expect(res.errors.map((e) => e.row)).toEqual([4, 5, 6, 7]);

    const exported = await exportProductsCsv();
    expect(exported).toContain("IMP1");
    expect(exported).toContain("IMP2");

    await deleteCategory(cat.id);
    await deleteUnit(unit.id);
  });

  it("rejects a missing header", async () => {
    const res = await importProductsCsv("foo,bar\n1,2\n");
    expect(res.imported).toBe(0);
    expect(res.errors[0].message).toContain("العناوين ناقصة");
  });

  it("round-trips export through import", async () => {
    const created = await createProduct({
      code: "RT1",
      name: "صنف للتصدير",
      buyPrice: 3,
      retailPrice: 5,
    });
    if (!created.ok) throw new Error("seed product failed");
    const before = await exportProductsCsv();
    expect(before).toContain("RT1");
    const res = await importProductsCsv(before, "user_1");
    // Every exported code already exists → all rows fail as duplicates.
    expect(res.imported).toBe(0);
    expect(res.failed).toBe(res.total);
    expect(res.total).toBeGreaterThan(0);
  });
});
