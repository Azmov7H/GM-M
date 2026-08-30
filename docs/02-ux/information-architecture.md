# Information Architecture

## Navigation Structure

```
الرئيسية (Home)
├── لوحة التحكم (Dashboard) ─── /
│
المبيعات (Sales)
├── نقطة البيع (POS) ─────────── /sales/pos        [accent CTA]
├── سجل الفواتير (Invoices) ──── /sales/invoices
├── مرتجع المبيعات (Returns) ── /sales/returns
│
المخزون (Inventory)
├── المنتجات (Products) ──────── /inventory/products
├── المخزون الحالي (Stock) ──── /inventory/stock
├── حركات المخزون (Movements) ─ /inventory/movements
├── الجرد (Physical Count) ──── /inventory/physical
├── التحويلات (Transfers) ───── /inventory/transfers
├── أوامر الشراء (Purchases) ── /inventory/purchases
│
العملاء والموردين (Parties)
├── العملاء (Customers) ──────── /parties/customers
├── العملاء/تفصيل (Customer) ── /parties/customers/[id]
├── الموردين (Suppliers) ─────── /parties/suppliers
│
المالية (Finance)
├── الخزينة (Treasury) ──────── /finance/treasury
├── الديون (Debts) ───────────── /finance/debts
├── الحركات المالية (Movements) /finance/movements
│
التقارير (Reports)
├── تقرير المبيعات (Sales) ───── /reports/sales
├── التقارير المالية (Financial) /reports/financial
├── أرباح العملاء (Profit) ──── /reports/profit
├── تاريخ الأسعار (Prices) ──── /reports/prices
├── النواقص (Shortages) ────── /reports/shortages
│
النظام (System)
├── المستخدمين (Users) ────────── /system/users
├── الإعدادات (Settings) ─────── /system/settings
├── سجل النشاط (Audit) ──────── /system/audit
```

## Page Hierarchy

### Depth 1 (Top-level)

- `/` — Dashboard
- `/sales/pos` — POS (primary CTA)
- `/inventory/products` — Products

### Depth 2 (Feature areas)

- `/sales/invoices` — Invoice list
- `/sales/returns` — Returns list
- `/inventory/stock` — Current stock
- `/inventory/movements` — Movement history
- `/parties/customers` — Customer list
- `/parties/suppliers` — Supplier list
- `/finance/treasury` — Treasury
- `/reports/sales` — Sales report

### Depth 3 (Detail views)

- `/parties/customers/[id]` — Customer detail (tabs)
- `/sales/invoices/[id]` — Invoice detail
- `/inventory/purchases/[id]` — Purchase order detail
- `/inventory/physical/[id]` — Physical count detail

## User Flows

### Flow: Quick Sale (POS)

```
Login → Dashboard → Click "نقطة البيع" CTA
  ↓
POS Screen (product search, cart)
  ↓
Search product → Add to cart → Set qty/price
  ↓
[Repeat for all items]
  ↓
Select customer (optional)
  ↓
Choose payment type (cash/credit)
  ↓
Process payment
  ↓
Invoice generated → Print option → Return to POS
```

### Flow: Inventory Check

```
Login → Dashboard → "المخزون" → "المخزون الحالي"
  ↓
Stock list with search/filter
  ↓
View product stock levels
  ↓
[If low] → "تحويل" to replenish
  ↓
[If needed] → "تعديل" to adjust
```

### Flow: Receive Purchase

```
Login → "أوامر الشراء" → Select purchase order
  ↓
View order details
  ↓
Click "استلام"
  ↓
Confirm received quantities
  ↓
Stock added to warehouse
  ↓
Order status updated
```

### Flow: Customer Payment

```
Login → "العملاء" → Select customer
  ↓
Customer detail (tabbed view)
  ↓
Click "تسجيل دفعة"
  ↓
Enter amount, payment method
  ↓
Submit → Balance updated
```

## Screen Specifications

### Dashboard

| Field             | Detail                                       |
| ----------------- | -------------------------------------------- |
| Screen ID         | SCR-DASH-001                                 |
| Purpose           | System overview and quick actions            |
| Primary User      | All roles                                    |
| Entry Point       | `/` (default landing)                        |
| Primary Actions   | Navigate to modules, view KPIs               |
| Secondary Actions | Quick POS entry, low stock alerts            |
| Required Data     | Sales summary, stock alerts, recent activity |
| States            | Loading, populated, empty (no data yet)      |
| Permissions       | `dashboard:view`                             |
| Responsive        | Sidebar collapses on tablet                  |

### POS

| Field             | Detail                                         |
| ----------------- | ---------------------------------------------- |
| Screen ID         | SCR-POS-001                                    |
| Purpose           | Create sales transactions                      |
| Primary User      | Cashier, Manager, Owner                        |
| Entry Point       | Sidebar → "نقطة البيع"                         |
| Primary Actions   | Search products, add to cart, process payment  |
| Secondary Actions | Select customer, view stock, price check       |
| Required Data     | Product catalog, stock levels, customer list   |
| States            | Empty cart, active cart, processing, completed |
| Permissions       | `invoices:create`                              |
| Responsive        | Two-pane on desktop, single pane on tablet     |

### Product List

| Field             | Detail                                             |
| ----------------- | -------------------------------------------------- |
| Screen ID         | SCR-PROD-001                                       |
| Purpose           | Browse and manage products                         |
| Primary User      | All roles (read), Manager/Owner (write)            |
| Entry Point       | Sidebar → "المنتجات"                               |
| Primary Actions   | Search, create, edit, delete                       |
| Secondary Actions | View stock level, category filter                  |
| Required Data     | Product list, categories, stock summary            |
| States            | Loading, populated, empty, error                   |
| Permissions       | `products:read` (view), `products:create` (create) |
| Responsive        | Table on desktop, cards on tablet                  |

### Invoice List

| Field             | Detail                                        |
| ----------------- | --------------------------------------------- |
| Screen ID         | SCR-INV-001                                   |
| Purpose           | View and manage invoices                      |
| Primary User      | Manager, Owner                                |
| Entry Point       | Sidebar → "سجل الفواتير"                      |
| Primary Actions   | Search, filter by date/customer, view details |
| Secondary Actions | Process return, export                        |
| Required Data     | Invoice list with totals                      |
| States            | Loading, populated, empty, error              |
| Permissions       | `invoices:read`                               |
| Responsive        | Table on desktop, list on tablet              |

### Customer Detail

| Field             | Detail                                   |
| ----------------- | ---------------------------------------- |
| Screen ID         | SCR-CUST-002                             |
| Purpose           | View customer profile and history        |
| Primary User      | Manager, Owner                           |
| Entry Point       | Customer list → Click row                |
| Primary Actions   | View data, record payment, view invoices |
| Secondary Actions | Edit customer, view payment history      |
| Required Data     | Customer data, invoices, payments        |
| States            | Loading, populated, not found            |
| Permissions       | `customers:read`                         |
| Responsive        | Tabs on desktop, accordion on tablet     |

### Stock Management

| Field             | Detail                                       |
| ----------------- | -------------------------------------------- |
| Screen ID         | SCR-STK-001                                  |
| Purpose           | View and adjust stock levels                 |
| Primary User      | Warehouse, Manager, Owner                    |
| Entry Point       | Sidebar → "المخزون الحالي"                   |
| Primary Actions   | Search, view levels, transfer, adjust        |
| Secondary Actions | View movement history, export                |
| Required Data     | Stock levels per location                    |
| States            | Loading, populated, empty                    |
| Permissions       | `stock:read` (view), `stock:manage` (adjust) |
| Responsive        | Table on desktop, cards on tablet            |
