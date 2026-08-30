import { randomUUID } from "crypto";
import type { DB } from "./index";
import {
  users,
  roles,
  permissions,
  userRoles,
  rolePermissions,
  categories,
  units,
  warehouses,
  products,
  stocks,
  customers,
  suppliers,
  type users as usersTable,
  type products as productsTable,
  type categories as categoriesTable,
  type units as unitsTable,
  type warehouses as warehousesTable,
  type customers as customersTable,
  type suppliers as suppliersTable,
} from "./schema";

export function uid(prefix: string): string {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

export async function createUser(
  db: DB,
  overrides: Partial<typeof usersTable.$inferInsert> = {},
) {
  const [row] = await db
    .insert(users)
    .values({
      id: uid("user"),
      username: `user_${randomUUID().slice(0, 8)}`,
      passwordHash: "sha256:test",
      displayName: "Test User",
      isActive: true,
      ...overrides,
    })
    .returning();
  return row;
}

export async function createRole(
  db: DB,
  overrides: Partial<typeof roles.$inferInsert> = {},
) {
  const [row] = await db
    .insert(roles)
    .values({
      id: uid("role"),
      name: `role_${randomUUID().slice(0, 8)}`,
      description: "Test role",
      ...overrides,
    })
    .returning();
  return row;
}

export async function createPermission(
  db: DB,
  overrides: Partial<typeof permissions.$inferInsert> = {},
) {
  const [row] = await db
    .insert(permissions)
    .values({
      id: uid("perm"),
      name: `perm_${randomUUID().slice(0, 8)}`,
      resource: "products",
      action: "read",
      ...overrides,
    })
    .returning();
  return row;
}

export async function assignRoleToUser(db: DB, userId: string, roleId: string) {
  return db
    .insert(userRoles)
    .values({ userId, roleId })
    .onConflictDoNothing()
    .returning();
}

export async function assignPermissionToRole(
  db: DB,
  roleId: string,
  permissionId: string,
) {
  return db
    .insert(rolePermissions)
    .values({ roleId, permissionId })
    .onConflictDoNothing()
    .returning();
}

export async function createCategory(
  db: DB,
  overrides: Partial<typeof categoriesTable.$inferInsert> = {},
) {
  const [row] = await db
    .insert(categories)
    .values({
      id: uid("cat"),
      name: `فئة ${randomUUID().slice(0, 4)}`,
      parentId: null,
      sortOrder: 0,
      ...overrides,
    })
    .returning();
  return row;
}

export async function createUnit(
  db: DB,
  overrides: Partial<typeof unitsTable.$inferInsert> = {},
) {
  const [row] = await db
    .insert(units)
    .values({
      id: uid("unit"),
      name: `وحدة ${randomUUID().slice(0, 4)}`,
      nameShort: "وحدة",
      ...overrides,
    })
    .returning();
  return row;
}

export async function createWarehouse(
  db: DB,
  overrides: Partial<typeof warehousesTable.$inferInsert> = {},
) {
  const [row] = await db
    .insert(warehouses)
    .values({
      id: uid("wh"),
      name: "المستودع الرئيسي",
      code: `WH-${randomUUID().slice(0, 4).toUpperCase()}`,
      isActive: true,
      ...overrides,
    })
    .returning();
  return row;
}

export async function createProduct(
  db: DB,
  overrides: Partial<typeof productsTable.$inferInsert> = {},
) {
  const [row] = await db
    .insert(products)
    .values({
      id: uid("prod"),
      code: `P-${randomUUID().slice(0, 4).toUpperCase()}`,
      name: `منتج ${randomUUID().slice(0, 4)}`,
      buyPrice: 10,
      retailPrice: 15,
      isActive: true,
      ...overrides,
    })
    .returning();
  return row;
}

export async function createStock(
  db: DB,
  productId: string,
  warehouseId: string,
  quantity = 50,
) {
  const [row] = await db
    .insert(stocks)
    .values({
      id: uid("stock"),
      productId,
      warehouseId,
      quantity,
    })
    .returning();
  return row;
}

export async function createCustomer(
  db: DB,
  overrides: Partial<typeof customersTable.$inferInsert> = {},
) {
  const [row] = await db
    .insert(customers)
    .values({
      id: uid("cust"),
      name: `عميل ${randomUUID().slice(0, 4)}`,
      isActive: true,
      ...overrides,
    })
    .returning();
  return row;
}

export async function createSupplier(
  db: DB,
  overrides: Partial<typeof suppliersTable.$inferInsert> = {},
) {
  const [row] = await db
    .insert(suppliers)
    .values({
      id: uid("supp"),
      name: `مورد ${randomUUID().slice(0, 4)}`,
      isActive: true,
      ...overrides,
    })
    .returning();
  return row;
}
