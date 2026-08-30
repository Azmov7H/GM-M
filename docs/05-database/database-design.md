# Database Architecture

## Overview

- **Engine:** SQLite 3.x
- **ORM:** Drizzle ORM 0.45
- **Driver:** better-sqlite3
- **Mode:** WAL (Write-Ahead Logging)
- **Location:** `data/app.db`
- **File Size Limit:** 1TB (theoretical), practical limit ~100GB

## Schema Design Principles

1. **UUID-like text IDs** — `prefix_xxx` format for readability
2. **ISO timestamps** — `text` type with ISO 8601 format
3. **Boolean as integer** — SQLite has no boolean; use 0/1
4. **Soft deletes** — `deletedAt` timestamp instead of `DELETE`
5. **Audit fields** — `createdAt`, `updatedAt` on all mutable tables
6. **Foreign keys** — Enforced at database level
7. **Indexes** — On frequently queried columns

## Complete Schema

### Foundation Tables

```sql
-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- Roles
CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Permissions
CREATE TABLE permissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL
);

-- User Roles (Many-to-Many)
CREATE TABLE user_roles (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Role Permissions (Many-to-Many)
CREATE TABLE role_permissions (
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Sessions
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Audit Logs
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL
);

-- Settings
CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  updated_at TEXT NOT NULL
);
```

### Business Tables

```sql
-- Categories
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES categories(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Units
CREATE TABLE units (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_short TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Warehouses (Locations)
CREATE TABLE warehouses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Products
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id TEXT REFERENCES categories(id),
  unit_id TEXT REFERENCES units(id),
  buy_price REAL NOT NULL DEFAULT 0,
  retail_price REAL NOT NULL DEFAULT 0,
  wholesale_price REAL,
  special_price REAL,
  min_profit_margin REAL DEFAULT 0,
  min_level INTEGER DEFAULT 5,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- Stock (per product per location)
CREATE TABLE stocks (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  UNIQUE(product_id, warehouse_id)
);

-- Stock Movements
CREATE TABLE stock_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  quantity INTEGER NOT NULL,
  type TEXT NOT NULL, -- IN, OUT, SALE, TRANSFER, ADJUST
  reference_type TEXT, -- sale, purchase, transfer, physical_inventory
  reference_id TEXT,
  reason TEXT,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);

-- Customers
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  balance REAL NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- Suppliers
CREATE TABLE suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  balance REAL NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- Sales (Invoices)
CREATE TABLE sales (
  id TEXT PRIMARY KEY,
  invoice_number INTEGER NOT NULL UNIQUE,
  customer_id TEXT REFERENCES customers(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  subtotal REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  payment_type TEXT NOT NULL DEFAULT 'cash', -- cash, credit, bank, wallet, check
  payment_status TEXT NOT NULL DEFAULT 'paid', -- paid, partial, unpaid
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed', -- completed, returned, cancelled
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Sale Items
CREATE TABLE sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id),
  product_name TEXT NOT NULL, -- snapshot
  product_code TEXT NOT NULL, -- snapshot
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  total REAL NOT NULL,
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  is_service INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Purchases
CREATE TABLE purchases (
  id TEXT PRIMARY KEY,
  order_number INTEGER NOT NULL UNIQUE,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  subtotal REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, submitted, received, cancelled
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Purchase Items
CREATE TABLE purchase_items (
  id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  received_quantity INTEGER NOT NULL DEFAULT 0,
  unit_cost REAL NOT NULL,
  total REAL NOT NULL,
  created_at TEXT NOT NULL
);

-- Payments
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL, -- customer, supplier
  entity_id TEXT NOT NULL,
  sale_id TEXT REFERENCES sales(id),
  amount REAL NOT NULL,
  payment_type TEXT NOT NULL, -- cash, bank, wallet, check
  notes TEXT,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);

-- Physical Inventory
CREATE TABLE physical_inventories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, counting, completed, approved
  warehouse_id TEXT REFERENCES warehouses(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Physical Inventory Items
CREATE TABLE physical_inventory_items (
  id TEXT PRIMARY KEY,
  physical_inventory_id TEXT NOT NULL REFERENCES physical_inventories(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  system_quantity INTEGER NOT NULL,
  counted_quantity INTEGER,
  variance INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_stocks_product ON stocks(product_id);
CREATE INDEX idx_stocks_warehouse ON stocks(warehouse_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX idx_stock_movements_created ON stock_movements(created_at);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_created ON sales(created_at);
CREATE INDEX idx_sales_invoice_number ON sales(invoice_number);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);
CREATE INDEX idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX idx_purchases_created ON purchases(created_at);
CREATE INDEX idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX idx_payments_entity ON payments(entity_type, entity_id);
CREATE INDEX idx_payments_created ON payments(created_at);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_settings_key ON settings(key);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_suppliers_name ON suppliers(suppliers.name);
```

## ERD Summary

```
users ──< user_roles >── roles ──< role_permissions >── permissions
users ──< sessions
users ──< audit_logs
users ──< sales
users ──< purchases
users ──< payments

categories ──< categories (self-referencing)
categories ──< products

products ──< stocks >── warehouses
products ──< stock_movements
products ──< sale_items
products ──< purchase_items
products ──< physical_inventory_items

customers ──< sales
customers ──< payments (entity_type='customer')

suppliers ──< purchases
suppliers ──< payments (entity_type='supplier')

sales ──< sale_items
sales ──< payments

purchases ──< purchase_items

physical_inventories ──< physical_inventory_items
```

## Migration Strategy

1. **Development:** Use `drizzle-kit push` for rapid prototyping
2. **Production:** Use `drizzle-kit generate` + `drizzle-kit migrate`
3. **Versioning:** All migrations stored in `drizzle/` directory
4. **Rollback:** Manual backup before migration; restore if needed
5. **Seeding:** Initial data (roles, permissions, admin user) via seed script
