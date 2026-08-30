import { randomUUID } from "crypto";
import { db } from "./index";
import {
  users,
  roles,
  permissions,
  userRoles,
  rolePermissions,
  settings,
} from "./schema";

const ROLE_SEEDS: (typeof roles.$inferInsert)[] = [
  { id: "role_owner", name: "owner", description: "المالك - صلاحيات كاملة" },
  { id: "role_manager", name: "manager", description: "المدير - إدارة العمليات" },
  {
    id: "role_cashier",
    name: "cashier",
    description: "أمين الصندوق - عمليات نقطة البيع",
  },
  {
    id: "role_warehouse",
    name: "warehouse",
    description: "أمين المخزون - إدارة المخزون",
  },
  {
    id: "role_viewer",
    name: "viewer",
    description: "مشاهد - صلاحيات قراءة فقط",
  },
];

const PERMISSION_SEEDS: {
  name: string;
  resource: string;
  action: string;
  description?: string;
}[] = [
  { name: "dashboard:view", resource: "dashboard", action: "view" },
  { name: "products:create", resource: "products", action: "create" },
  { name: "products:read", resource: "products", action: "read" },
  { name: "products:update", resource: "products", action: "update" },
  { name: "products:delete", resource: "products", action: "delete" },
  { name: "products:read_stock", resource: "products", action: "read_stock" },
  { name: "categories:manage", resource: "categories", action: "manage" },
  { name: "categories:read", resource: "categories", action: "read" },
  { name: "stock:read", resource: "stock", action: "read" },
  { name: "stock:manage", resource: "stock", action: "manage" },
  { name: "stock:transfer", resource: "stock", action: "transfer" },
  { name: "physical_inventory:manage", resource: "physical_inventory", action: "manage" },
  { name: "invoices:create", resource: "invoices", action: "create" },
  { name: "invoices:read", resource: "invoices", action: "read" },
  { name: "invoices:update", resource: "invoices", action: "update" },
  { name: "invoices:delete", resource: "invoices", action: "delete" },
  { name: "invoices:return", resource: "invoices", action: "return" },
  { name: "purchases:create", resource: "purchases", action: "create" },
  { name: "purchases:read", resource: "purchases", action: "read" },
  { name: "purchases:update", resource: "purchases", action: "update" },
  { name: "purchases:delete", resource: "purchases", action: "delete" },
  { name: "customers:create", resource: "customers", action: "create" },
  { name: "customers:read", resource: "customers", action: "read" },
  { name: "customers:update", resource: "customers", action: "update" },
  { name: "customers:delete", resource: "customers", action: "delete" },
  { name: "suppliers:create", resource: "suppliers", action: "create" },
  { name: "suppliers:read", resource: "suppliers", action: "read" },
  { name: "suppliers:update", resource: "suppliers", action: "update" },
  { name: "suppliers:delete", resource: "suppliers", action: "delete" },
  { name: "financial:read", resource: "financial", action: "read" },
  { name: "financial:manage", resource: "financial", action: "manage" },
  { name: "reports:view", resource: "reports", action: "view" },
  { name: "users:create", resource: "users", action: "create" },
  { name: "users:read", resource: "users", action: "read" },
  { name: "users:update", resource: "users", action: "update" },
  { name: "users:delete", resource: "users", action: "delete" },
  { name: "settings:read", resource: "settings", action: "read" },
  { name: "settings:update", resource: "settings", action: "update" },
  { name: "audit:view", resource: "audit", action: "view" },
  { name: "backup:create", resource: "backup", action: "create" },
  { name: "backup:restore", resource: "backup", action: "restore" },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: PERMISSION_SEEDS.map((p) => p.name),
  manager: [
    "dashboard:view",
    "products:create",
    "products:read",
    "products:update",
    "products:delete",
    "products:read_stock",
    "categories:manage",
    "stock:read",
    "stock:manage",
    "stock:transfer",
    "physical_inventory:manage",
    "invoices:create",
    "invoices:read",
    "invoices:update",
    "invoices:delete",
    "invoices:return",
    "purchases:create",
    "purchases:read",
    "purchases:update",
    "purchases:delete",
    "customers:create",
    "customers:read",
    "customers:update",
    "suppliers:create",
    "suppliers:read",
    "suppliers:update",
    "financial:read",
    "financial:manage",
    "reports:view",
    "users:create",
    "users:read",
    "users:update",
    "settings:read",
    "settings:update",
    "audit:view",
  ],
  cashier: [
    "dashboard:view",
    "products:read",
    "products:read_stock",
    "invoices:create",
    "invoices:read",
    "customers:read",
  ],
  warehouse: [
    "dashboard:view",
    "products:read",
    "products:read_stock",
    "stock:read",
    "stock:manage",
    "stock:transfer",
    "physical_inventory:manage",
    "categories:read",
  ],
  viewer: [
    "dashboard:view",
    "products:read",
    "products:read_stock",
    "stock:read",
    "reports:view",
  ],
};

const SETTING_SEEDS = [
  {
    key: "store.name",
    value: "نظام الجماز",
    category: "general",
    description: "اسم المتجر",
  },
  { key: "store.currency", value: "SAR", category: "general", description: "العملة" },
  {
    key: "inventory.min_level_default",
    value: "5",
    category: "inventory",
    description: "حد المخزون الأدنى الافتراضي",
  },
  {
    key: "invoice.prefix",
    value: "INV",
    category: "invoice",
    description: "بادئة رقم الفاتورة",
  },
  {
    key: "sale.allow_below_cost",
    value: "false",
    category: "sale",
    description: "السماح بالبيع بأقل من التكلفة",
  },
];

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return `sha256:${Buffer.from(String(Math.abs(hash))).toString("hex")}`;
}

export async function seedDatabase() {
  const existing = await db.select().from(roles).limit(1);
  if (existing.length > 0) {
    console.log("Database already seeded — skipping.");
    return;
  }

  await db.insert(roles).values(ROLE_SEEDS).onConflictDoNothing();

  await db
    .insert(permissions)
    .values(
      PERMISSION_SEEDS.map((p) => ({
        ...p,
        id: `perm_${randomUUID().slice(0, 8)}`,
      })),
    )
    .onConflictDoNothing();

  const permRows = await db.select().from(permissions);
  const permIdByName = new Map(permRows.map((p) => [p.name, p.id]));

  const roleRows = await db.select().from(roles);
  const roleIdByName = new Map(roleRows.map((r) => [r.name, r.id]));

  const rolePermValues: (typeof rolePermissions.$inferInsert)[] = [];
  for (const role of ROLE_SEEDS) {
    const permNames = ROLE_PERMISSIONS[role.name] ?? [];
    for (const permName of permNames) {
      const roleId = roleIdByName.get(role.name);
      const permId = permIdByName.get(permName);
      if (roleId && permId) {
        rolePermValues.push({ roleId, permissionId: permId });
      }
    }
  }
  await db.insert(rolePermissions).values(rolePermValues).onConflictDoNothing();

  const adminId = `user_${randomUUID().slice(0, 8)}`;
  await db
    .insert(users)
    .values({
      id: adminId,
      username: "admin",
      email: "admin@localhost",
      passwordHash: hashPassword("admin123"),
      displayName: "المدير العام",
      isActive: true,
    })
    .onConflictDoNothing();

  const ownerRoleId = roleIdByName.get("owner");
  if (ownerRoleId) {
    await db
      .insert(userRoles)
      .values({ userId: adminId, roleId: ownerRoleId })
      .onConflictDoNothing();
  }

  const now = new Date().toISOString();
  await db
    .insert(settings)
    .values(
      SETTING_SEEDS.map((s) => ({
        ...s,
        id: `setting_${randomUUID().slice(0, 8)}`,
        updatedAt: now,
      })),
    )
    .onConflictDoNothing();

  console.log(`Seed complete. Seed a total of:`);
  console.log(`  - ${ROLE_SEEDS.length} roles`);
  console.log(`  - ${PERMISSION_SEEDS.length} permissions`);
  console.log(`  - ${rolePermValues.length} role-permission mappings`);
  console.log(`  - ${SETTING_SEEDS.length} settings`);
  console.log(`  - admin user (username: admin / password: admin123)`);
}

if (process.argv[1]?.endsWith("seed.ts")) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
