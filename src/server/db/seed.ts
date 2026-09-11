import { randomUUID } from "crypto";
import { db } from "./index";
import {
  users,
  roles,
  permissions,
  userRoles,
  rolePermissions,
  settings,
  categories,
  units,
  warehouses,
  products,
  customers,
  suppliers,
  stocks,
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
    key: "company.name",
    value: "مؤسستي",
    category: "general",
    description: "اسم الشركة",
  },
  { key: "company.phone", value: "", category: "general", description: "هاتف الشركة" },
  { key: "company.address", value: "", category: "general", description: "عنوان الشركة" },
  {
    key: "company.footer",
    value: "",
    category: "general",
    description: "تذييل الفاتورة",
  },
  {
    key: "invoice.template",
    value: "standard",
    category: "invoice",
    description: "قالب الفاتورة",
  },
  { key: "invoice.paper", value: "a4", category: "invoice", description: "مقاس الورق" },
  {
    key: "invoice.show_customer",
    value: "true",
    category: "invoice",
    description: "إظهار العميل",
  },
  {
    key: "invoice.show_payment",
    value: "true",
    category: "invoice",
    description: "إظهار الدفع",
  },
  {
    key: "invoice.show_cashier",
    value: "true",
    category: "invoice",
    description: "إظهار البائع",
  },
  {
    key: "sale.allow_below_cost",
    value: "false",
    category: "sales",
    description: "السماح بالبيع بأقل من التكلفة",
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

async function bcryptPassword(password: string): Promise<string> {
  const { hash } = await import("bcryptjs");
  return hash(password, 12);
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
      passwordHash: await bcryptPassword("admin123"),
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

  await seedDemoData();

  console.log(`Seed complete. Seed a total of:`);
  console.log(`  - ${ROLE_SEEDS.length} roles`);
  console.log(`  - ${PERMISSION_SEEDS.length} permissions`);
  console.log(`  - ${rolePermValues.length} role-permission mappings`);
  console.log(`  - ${SETTING_SEEDS.length} settings`);
  console.log(`  - admin user (username: admin / password: admin123)`);
}

const UNIT_SEEDS = [
  { id: "unit_piece", name: "قطعة", nameShort: "قطعة" },
  { id: "unit_box", name: "صندوق", nameShort: "صندوق" },
  { id: "unit_kg", name: "كيلوغرام", nameShort: "كجم" },
  { id: "unit_liter", name: "لتر", nameShort: "لتر" },
  { id: "unit_carton", name: "كرتونة", nameShort: "كرتونة" },
];

const WAREHOUSE_SEEDS = [
  { id: "wh_main", name: "المستودع الرئيسي", code: "WH-01", isActive: true },
  { id: "wh_shop", name: "المعرض", code: "SH-01", isActive: true },
];

const CATEGORY_SEEDS = [
  { id: "cat_grocery", name: "مواد غذائية", parentId: null },
  { id: "cat_beverages", name: "مشروبات", parentId: null },
  { id: "cat_cleaning", name: "منظفات", parentId: null },
  { id: "cat_snacks", name: "وجبات خفيفة", parentId: null },
  { id: "cat_dairy", name: "ألبان", parentId: null },
];

const PRODUCT_SEEDS: (typeof products.$inferInsert)[] = [
  {
    id: "prod_rice",
    name: "أرز بسمتي 5 كجم",
    code: "P-0001",
    categoryId: "cat_grocery",
    unitId: "unit_box",
    buyPrice: 32,
    retailPrice: 39,
    wholesalePrice: 36,
    minLevel: 10,
  },
  {
    id: "prod_sugar",
    name: "سكر 1 كجم",
    code: "P-0002",
    categoryId: "cat_grocery",
    unitId: "unit_box",
    buyPrice: 5,
    retailPrice: 7,
    wholesalePrice: 6.5,
    minLevel: 20,
  },
  {
    id: "prod_oil",
    name: "زيت دوار الشمس 1.5 لتر",
    code: "P-0003",
    categoryId: "cat_grocery",
    unitId: "unit_box",
    buyPrice: 14,
    retailPrice: 18,
    wholesalePrice: 17,
    minLevel: 15,
  },
  {
    id: "prod_water",
    name: "مياه معدنية 1.5 لتر",
    code: "P-0004",
    categoryId: "cat_beverages",
    unitId: "unit_carton",
    buyPrice: 5,
    retailPrice: 7,
    wholesalePrice: 6,
    minLevel: 30,
  },
  {
    id: "prod_juice",
    name: "عصير برتقال 1 لتر",
    code: "P-0005",
    categoryId: "cat_beverages",
    unitId: "unit_carton",
    buyPrice: 8,
    retailPrice: 10,
    wholesalePrice: 9,
    minLevel: 20,
  },
  {
    id: "prod_soda",
    name: "مشروب غازي 330 مل",
    code: "P-0006",
    categoryId: "cat_beverages",
    unitId: "unit_carton",
    buyPrice: 1.5,
    retailPrice: 2,
    wholesalePrice: 1.8,
    minLevel: 50,
  },
  {
    id: "prod_detergent",
    name: "مسحوق غسيل 3 كجم",
    code: "P-0007",
    categoryId: "cat_cleaning",
    unitId: "unit_box",
    buyPrice: 22,
    retailPrice: 28,
    wholesalePrice: 26,
    minLevel: 10,
  },
  {
    id: "prod_dishsoap",
    name: "سائل غسيل أواني 1 لتر",
    code: "P-0008",
    categoryId: "cat_cleaning",
    unitId: "unit_box",
    buyPrice: 6,
    retailPrice: 8,
    wholesalePrice: 7,
    minLevel: 15,
  },
  {
    id: "prod_chips",
    name: "شيبس 200 جم",
    code: "P-0009",
    categoryId: "cat_snacks",
    unitId: "unit_box",
    buyPrice: 3,
    retailPrice: 4,
    wholesalePrice: 3.5,
    minLevel: 40,
  },
  {
    id: "prod_chocolate",
    name: "شوكولاتة 100 جم",
    code: "P-0010",
    categoryId: "cat_snacks",
    unitId: "unit_box",
    buyPrice: 4,
    retailPrice: 5.5,
    wholesalePrice: 5,
    minLevel: 30,
  },
  {
    id: "prod_milk",
    name: "حليب طازج 1 لتر",
    code: "P-0011",
    categoryId: "cat_dairy",
    unitId: "unit_box",
    buyPrice: 6,
    retailPrice: 7.5,
    wholesalePrice: 7,
    minLevel: 15,
  },
  {
    id: "prod_yogurt",
    name: "زبادي 1 كجم",
    code: "P-0012",
    categoryId: "cat_dairy",
    unitId: "unit_box",
    buyPrice: 5,
    retailPrice: 6.5,
    wholesalePrice: 6,
    minLevel: 15,
  },
];

const CUSTOMER_SEEDS = [
  { id: "cust_trade1", name: "محل التوفيق", phone: "0550000001" },
  { id: "cust_trade2", name: "بقالة النور", phone: "0550000002" },
  { id: "cust_trade3", name: "سوبر ماركت الأمانة", phone: "0550000003" },
];

const SUPPLIER_SEEDS = [
  { id: "supp_wholesale1", name: "المؤسسة الوطنية للمواد الغذائية", phone: "0110000001" },
  { id: "supp_wholesale2", name: "شركة التوزيع الموحد", phone: "0110000002" },
  { id: "supp_wholesale3", name: "مصنع الألبان الحديث", phone: "0110000003" },
];

async function seedDemoData() {
  await db.insert(units).values(UNIT_SEEDS).onConflictDoNothing();

  await db.insert(categories).values(CATEGORY_SEEDS).onConflictDoNothing();

  await db.insert(warehouses).values(WAREHOUSE_SEEDS).onConflictDoNothing();

  await db.insert(products).values(PRODUCT_SEEDS).onConflictDoNothing();

  const stockInserts: (typeof stocks.$inferInsert)[] = [];
  for (const product of PRODUCT_SEEDS) {
    for (const warehouse of WAREHOUSE_SEEDS) {
      stockInserts.push({
        id: `stock_${randomUUID().slice(0, 8)}`,
        productId: product.id!,
        warehouseId: warehouse.id,
        quantity: 60 + Math.floor(Math.random() * 200),
      });
    }
  }
  await db.insert(stocks).values(stockInserts).onConflictDoNothing();

  const customerInserts: (typeof customers.$inferInsert)[] = CUSTOMER_SEEDS.map((c) => ({
    ...c,
    id: `customer_${randomUUID().slice(0, 8)}`,
  }));
  await db.insert(customers).values(customerInserts).onConflictDoNothing();

  const supplierInserts: (typeof suppliers.$inferInsert)[] = SUPPLIER_SEEDS.map((s) => ({
    ...s,
    id: `supplier_${randomUUID().slice(0, 8)}`,
  }));
  await db.insert(suppliers).values(supplierInserts).onConflictDoNothing();

  console.log(
    `  - Demo data seeded (${UNIT_SEEDS.length} units, ${CATEGORY_SEEDS.length} categories, ${WAREHOUSE_SEEDS.length} warehouses, ${PRODUCT_SEEDS.length} products, ${stockInserts.length} stock records, ${CUSTOMER_SEEDS.length} customers, ${SUPPLIER_SEEDS.length} suppliers)`,
  );
}

if (process.argv[1]?.endsWith("seed.ts")) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
