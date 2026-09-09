import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  type SQLiteColumn,
} from "drizzle-orm/sqlite-core";

const iso = () => new Date().toISOString();

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull().unique(),
    email: text("email").unique(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    deletedAt: text("deleted_at"),
    createdAt: text("created_at").notNull().$defaultFn(iso),
    updatedAt: text("updated_at").notNull().$defaultFn(iso),
  },
  (t) => [
    index("idx_users_username").on(t.username),
    index("idx_users_email").on(t.email),
  ],
);

export const roles = sqliteTable("roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: text("created_at").notNull().$defaultFn(iso),
  updatedAt: text("updated_at").notNull().$defaultFn(iso),
});

export const permissions = sqliteTable("permissions", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  resource: text("resource").notNull(),
  action: text("action").notNull(),
});

export const userRoles = sqliteTable("user_roles", {
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  roleId: text("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
});

export const rolePermissions = sqliteTable("role_permissions", {
  roleId: text("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  permissionId: text("permission_id")
    .notNull()
    .references(() => permissions.id, { onDelete: "cascade" }),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull().$defaultFn(iso),
  },
  (t) => [
    index("idx_sessions_user").on(t.userId),
    index("idx_sessions_expires").on(t.expiresAt),
  ],
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id),
    action: text("action").notNull(),
    resource: text("resource").notNull(),
    resourceId: text("resource_id"),
    details: text("details"),
    ipAddress: text("ip_address"),
    createdAt: text("created_at").notNull().$defaultFn(iso),
  },
  (t) => [
    index("idx_audit_logs_user").on(t.userId),
    index("idx_audit_logs_resource").on(t.resource, t.resourceId),
    index("idx_audit_logs_created").on(t.createdAt),
  ],
);

export const settings = sqliteTable(
  "settings",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull().unique(),
    value: text("value").notNull(),
    category: text("category").notNull().default("general"),
    description: text("description"),
    updatedAt: text("updated_at").notNull().$defaultFn(iso),
  },
  (t) => [index("idx_settings_key").on(t.key)],
);

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    parentId: text("parent_id").references((): SQLiteColumn => categories.id),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().$defaultFn(iso),
    updatedAt: text("updated_at").notNull().$defaultFn(iso),
  },
  (t) => [index("idx_categories_parent").on(t.parentId)],
);

export const units = sqliteTable("units", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  nameShort: text("name_short").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(iso),
});

export const warehouses = sqliteTable("warehouses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().$defaultFn(iso),
  updatedAt: text("updated_at").notNull().$defaultFn(iso),
});

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    categoryId: text("category_id").references(() => categories.id),
    unitId: text("unit_id").references(() => units.id),
    buyPrice: real("buy_price").notNull().default(0),
    retailPrice: real("retail_price").notNull().default(0),
    wholesalePrice: real("wholesale_price"),
    specialPrice: real("special_price"),
    minProfitMargin: real("min_profit_margin").default(0),
    minLevel: integer("min_level").default(5),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    deletedAt: text("deleted_at"),
    createdAt: text("created_at").notNull().$defaultFn(iso),
    updatedAt: text("updated_at").notNull().$defaultFn(iso),
  },
  (t) => [
    index("idx_products_code").on(t.code),
    index("idx_products_name").on(t.name),
    index("idx_products_category").on(t.categoryId),
  ],
);

export const stocks = sqliteTable(
  "stocks",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    warehouseId: text("warehouse_id")
      .notNull()
      .references(() => warehouses.id),
    quantity: integer("quantity").notNull().default(0),
    updatedAt: text("updated_at").notNull().$defaultFn(iso),
  },
  (t) => [
    index("idx_stocks_product").on(t.productId),
    index("idx_stocks_warehouse").on(t.warehouseId),
  ],
);

export const stockMovements = sqliteTable(
  "stock_movements",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    warehouseId: text("warehouse_id")
      .notNull()
      .references(() => warehouses.id),
    quantity: integer("quantity").notNull(),
    type: text("type").notNull(),
    referenceType: text("reference_type"),
    referenceId: text("reference_id"),
    reason: text("reason"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    createdAt: text("created_at").notNull().$defaultFn(iso),
  },
  (t) => [
    index("idx_stock_movements_product").on(t.productId),
    index("idx_stock_movements_warehouse").on(t.warehouseId),
    index("idx_stock_movements_created").on(t.createdAt),
  ],
);

export const customers = sqliteTable(
  "customers",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    balance: real("balance").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    deletedAt: text("deleted_at"),
    createdAt: text("created_at").notNull().$defaultFn(iso),
    updatedAt: text("updated_at").notNull().$defaultFn(iso),
  },
  (t) => [index("idx_customers_name").on(t.name)],
);

export const suppliers = sqliteTable(
  "suppliers",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    balance: real("balance").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    deletedAt: text("deleted_at"),
    createdAt: text("created_at").notNull().$defaultFn(iso),
    updatedAt: text("updated_at").notNull().$defaultFn(iso),
  },
  (t) => [index("idx_suppliers_name").on(t.name)],
);

export const sales = sqliteTable(
  "sales",
  {
    id: text("id").primaryKey(),
    invoiceNumber: integer("invoice_number").notNull().unique(),
    customerId: text("customer_id").references(() => customers.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    subtotal: real("subtotal").notNull().default(0),
    discount: real("discount").notNull().default(0),
    tax: real("tax").notNull().default(0),
    total: real("total").notNull().default(0),
    paymentType: text("payment_type").notNull().default("cash"),
    paymentStatus: text("payment_status").notNull().default("paid"),
    notes: text("notes"),
    status: text("status").notNull().default("completed"),
    createdAt: text("created_at").notNull().$defaultFn(iso),
    updatedAt: text("updated_at").notNull().$defaultFn(iso),
  },
  (t) => [
    index("idx_sales_customer").on(t.customerId),
    index("idx_sales_created").on(t.createdAt),
    index("idx_sales_invoice_number").on(t.invoiceNumber),
  ],
);

export const saleItems = sqliteTable(
  "sale_items",
  {
    id: text("id").primaryKey(),
    saleId: text("sale_id")
      .notNull()
      .references(() => sales.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id),
    productName: text("product_name").notNull(),
    productCode: text("product_code").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: real("unit_price").notNull(),
    total: real("total").notNull(),
    warehouseId: text("warehouse_id")
      .notNull()
      .references(() => warehouses.id),
    isService: integer("is_service", { mode: "boolean" }).notNull().default(false),
    returnedQuantity: integer("returned_quantity").notNull().default(0),
    createdAt: text("created_at").notNull().$defaultFn(iso),
  },
  (t) => [
    index("idx_sale_items_sale").on(t.saleId),
    index("idx_sale_items_product").on(t.productId),
  ],
);

export const saleReturns = sqliteTable(
  "sale_returns",
  {
    id: text("id").primaryKey(),
    saleId: text("sale_id")
      .notNull()
      .references(() => sales.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    reason: text("reason").notNull(),
    total: real("total").notNull().default(0),
    createdAt: text("created_at").notNull().$defaultFn(iso),
  },
  (t) => [index("idx_sale_returns_sale").on(t.saleId)],
);

export const purchases = sqliteTable(
  "purchases",
  {
    id: text("id").primaryKey(),
    orderNumber: integer("order_number").notNull().unique(),
    supplierId: text("supplier_id")
      .notNull()
      .references(() => suppliers.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    subtotal: real("subtotal").notNull().default(0),
    tax: real("tax").notNull().default(0),
    total: real("total").notNull().default(0),
    status: text("status").notNull().default("draft"),
    notes: text("notes"),
    createdAt: text("created_at").notNull().$defaultFn(iso),
    updatedAt: text("updated_at").notNull().$defaultFn(iso),
  },
  (t) => [
    index("idx_purchases_supplier").on(t.supplierId),
    index("idx_purchases_created").on(t.createdAt),
  ],
);

export const purchaseItems = sqliteTable(
  "purchase_items",
  {
    id: text("id").primaryKey(),
    purchaseId: text("purchase_id")
      .notNull()
      .references(() => purchases.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    quantity: integer("quantity").notNull(),
    receivedQuantity: integer("received_quantity").notNull().default(0),
    unitCost: real("unit_cost").notNull(),
    total: real("total").notNull(),
    createdAt: text("created_at").notNull().$defaultFn(iso),
  },
  (t) => [
    index("idx_purchase_items_purchase").on(t.purchaseId),
    index("idx_purchase_items_product").on(t.productId),
  ],
);

export const payments = sqliteTable(
  "payments",
  {
    id: text("id").primaryKey(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    saleId: text("sale_id").references(() => sales.id),
    amount: real("amount").notNull(),
    paymentType: text("payment_type").notNull(),
    notes: text("notes"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    createdAt: text("created_at").notNull().$defaultFn(iso),
  },
  (t) => [
    index("idx_payments_entity").on(t.entityType, t.entityId),
    index("idx_payments_created").on(t.createdAt),
  ],
);

export const physicalInventories = sqliteTable("physical_inventories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("draft"),
  warehouseId: text("warehouse_id").references(() => warehouses.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(iso),
  updatedAt: text("updated_at").notNull().$defaultFn(iso),
});

export const physicalInventoryItems = sqliteTable("physical_inventory_items", {
  id: text("id").primaryKey(),
  physicalInventoryId: text("physical_inventory_id")
    .notNull()
    .references(() => physicalInventories.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  systemQuantity: integer("system_quantity").notNull(),
  countedQuantity: integer("counted_quantity"),
  variance: integer("variance"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(iso),
  updatedAt: text("updated_at").notNull().$defaultFn(iso),
});

export const stockTransfers = sqliteTable("stock_transfers", {
  id: text("id").primaryKey(),
  fromWarehouseId: text("from_warehouse_id")
    .references(() => warehouses.id)
    .notNull(),
  toWarehouseId: text("to_warehouse_id")
    .references(() => warehouses.id)
    .notNull(),
  productId: text("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(iso),
});
