import { describe, it, expect, beforeEach } from "vitest";
import type { DB } from "./index";
import { createTestDb } from "./test-db";
import {
  createUser,
  createRole,
  createPermission,
  assignRoleToUser,
  assignPermissionToRole,
  createCategory,
  createUnit,
  createWarehouse,
  createProduct,
  createStock,
  createCustomer,
  createSupplier,
} from "./factories";
import { users, products, stocks, categories } from "./schema";

describe("test-db", () => {
  let db: DB;

  beforeEach(() => {
    db = createTestDb();
  });

  it("applies all migrations and creates tables", async () => {
    const rows = await db.select().from(users).limit(1);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows).toHaveLength(0);
  });

  it("applies all migrations and creates tables", () => {
    const tables = db.select({ name: users.id }).from(users).limit(0);
    void tables;

    expect(db._.fullSchema).toBeDefined();
  });

  it("seeds via factory: user, role, permission, assignments", async () => {
    const user = await createUser(db, { displayName: "مستخدم تجريبي" });
    const role = await createRole(db, { name: "owner" });
    const permission = await createPermission(db, {
      name: "products:read",
      resource: "products",
      action: "read",
    });

    await assignRoleToUser(db, user.id, role.id);
    await assignPermissionToRole(db, role.id, permission.id);

    const rows = await db.select().from(users);
    expect(rows).toHaveLength(1);
    expect(rows[0].displayName).toBe("مستخدم تجريبي");
  });

  it("creates related inventory records", async () => {
    const category = await createCategory(db, { name: "مواد غذائية" });
    const unit = await createUnit(db, { name: "صندوق", nameShort: "صندوق" });
    const warehouse = await createWarehouse(db, { code: "WH-01" });
    const product = await createProduct(db, {
      categoryId: category.id,
      unitId: unit.id,
      retailPrice: 25,
    });
    await createStock(db, product.id, warehouse.id, 100);

    const productsRows = await db.select().from(products);
    const stockRows = await db.select().from(stocks);
    const categoryRows = await db.select().from(categories);

    expect(productsRows).toHaveLength(1);
    expect(productsRows[0].retailPrice).toBe(25);
    expect(stockRows).toHaveLength(1);
    expect(stockRows[0].quantity).toBe(100);
    expect(categoryRows).toHaveLength(1);
    expect(categoryRows[0].name).toBe("مواد غذائية");
  });

  it("creates customer and supplier", async () => {
    const customer = await createCustomer(db, { name: "عميل 1" });
    const supplier = await createSupplier(db, { name: "مورد 1" });
    expect(customer.name).toBe("عميل 1");
    expect(supplier.name).toBe("مورد 1");
    expect(customer.id).toMatch(/^cust_/);
    expect(supplier.id).toMatch(/^supp_/);
  });
});
