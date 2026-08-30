import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, type DB } from "../db/test-db";
import { BaseRepository } from "./base-repository";
import { categories } from "../db/schema";

describe("BaseRepository", () => {
  let db: DB;

  beforeEach(() => {
    db = createTestDb();
  });

  it("creates and finds a record by id", async () => {
    const repo = new BaseRepository(db, categories);
    const cat = (await repo.create({ name: "مواد غذائية", sort_order: 0 })) as Record<
      string,
      unknown
    >;
    const found = (await repo.findById(cat.id as string)) as Record<string, unknown>;
    expect(found).toBeDefined();
    expect(found.name).toBe("مواد غذائية");
  });

  it("updates a record", async () => {
    const repo = new BaseRepository(db, categories);
    const cat = (await repo.create({ name: "مشروبات", sort_order: 0 })) as Record<
      string,
      unknown
    >;
    const updated = (await repo.update(cat.id as string, {
      name: "مشروبات غازية",
    })) as Record<string, unknown>;
    expect(updated.name).toBe("مشروبات غازية");
  });

  it("deletes a record", async () => {
    const repo = new BaseRepository(db, categories);
    const cat = (await repo.create({ name: "للمسح", sort_order: 0 })) as Record<
      string,
      unknown
    >;
    const deleted = await repo.hardDelete(cat.id as string);
    expect(deleted).toBeDefined();
    const found = await repo.findById(cat.id as string);
    expect(found).toBeUndefined();
  });

  it("counts records", async () => {
    const repo = new BaseRepository(db, categories);
    expect(await repo.count()).toBe(0);
    await repo.create({ name: "الفئة 1", sort_order: 0 });
    expect(await repo.count()).toBe(1);
    await repo.create({ name: "الفئة 2", sort_order: 1 });
    expect(await repo.count()).toBe(2);
  });

  it("findAll returns all records", async () => {
    const repo = new BaseRepository(db, categories);
    await repo.create({ name: "فئة آلية", sort_order: 0 });
    await repo.create({ name: "فئة ثانية", sort_order: 1 });
    const all = await repo.findAll();
    expect(all).toHaveLength(2);
  });
});
