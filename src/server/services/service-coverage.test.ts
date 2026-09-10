import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", async () => {
  const { createTestDb } = await import("@/server/db/test-db");
  return { db: createTestDb() };
});

vi.mock("./audit.service", () => ({
  logAudit: vi.fn(async () => undefined),
}));

import { db } from "@/server/db";
import { updateCategory } from "./category.service";
import { updateUnit } from "./unit.service";
import { listCustomers } from "./customer.service";
import { getUserDetail, listRoles } from "./user.service";
import { createUser as mkUser } from "@/server/db/factories";
import { createCategory } from "./category.service";
import { createUnit } from "./unit.service";

describe("catalog updates", () => {
  it("renames categories and rejects self-parenting", async () => {
    const cat = await createCategory({ name: "قابلة للتعديل" });
    if (!cat.ok) throw new Error("seed failed");
    expect(await updateCategory(cat.id, { name: "معدلة" })).toMatchObject({
      ok: true,
    });
    expect(await updateCategory(cat.id, { parentId: cat.id })).toMatchObject({
      ok: false,
    });
    expect(await updateCategory("missing", { name: "x" })).toMatchObject({
      ok: false,
    });
  });

  it("renames units and rejects missing rows", async () => {
    const unit = await createUnit({ name: "وحدة تعديل", nameShort: "وت" });
    if (!unit.ok) throw new Error("seed failed");
    expect(await updateUnit(unit.id, { name: "معدلة" })).toMatchObject({
      ok: true,
    });
    expect(await updateUnit("missing", { name: "x" })).toMatchObject({
      ok: false,
    });
  });
});

describe("pos customer lookup", () => {
  it("lists customers for the POS selector", async () => {
    await mkUser(db, { username: "lookup_probe" });
    const rows = await listCustomers();
    expect(Array.isArray(rows)).toBe(true);
  });
});

describe("user reads", () => {
  it("returns detail without password hash and lists roles", async () => {
    const user = await mkUser(db, { username: "detail_probe" });
    const detail = await getUserDetail(user.id);
    expect(detail?.username).toBe("detail_probe");
    expect(detail).not.toHaveProperty("passwordHash");
    expect(await getUserDetail("missing")).toBeNull();
    expect(Array.isArray(await listRoles())).toBe(true);
  });
});
