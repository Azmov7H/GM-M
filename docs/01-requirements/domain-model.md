# Business Domain Model

## Entities

### Core Entities

| Entity                | Arabic     | ID Format  | Description              |
| --------------------- | ---------- | ---------- | ------------------------ |
| User                  | المستخدم   | `usr_xxx`  | System user              |
| Role                  | الصلاحية   | `role_xxx` | User role                |
| Permission            | صلاحية     | `perm_xxx` | Granular permission      |
| Session               | الجلسة     | `ses_xxx`  | Active user session      |
| Product               | المنتج     | `prd_xxx`  | Inventory item           |
| Category              | التصنيف    | `cat_xxx`  | Product category         |
| Unit                  | الوحدة     | `unt_xxx`  | Unit of measurement      |
| Warehouse             | المخزن     | `wh_xxx`   | Storage location         |
| Stock                 | المخزون    | —          | Product qty per location |
| StockMovement         | حركة مخزون | `smv_xxx`  | Stock change record      |
| Customer              | العميل     | `cust_xxx` | Customer account         |
| Supplier              | المورد     | `sup_xxx`  | Supplier account         |
| Sale                  | فاتورة     | `sal_xxx`  | Sales transaction        |
| SaleItem              | بند فاتورة | `sli_xxx`  | Line item in sale        |
| Purchase              | أمر شراء   | `pur_xxx`  | Purchase order           |
| PurchaseItem          | بند شراء   | `pri_xxx`  | Line item in purchase    |
| Payment               | دفعة       | `pay_xxx`  | Payment transaction      |
| PhysicalInventory     | جرد        | `pin_xxx`  | Physical count session   |
| PhysicalInventoryItem | بند جرد    | `pii_xxx`  | Count result per product |
| Expense               | مصروف      | `exp_xxx`  | Financial expense        |
| AuditLog              | سجل تدقيق  | `aud_xxx`  | Audit trail entry        |
| Setting               | إعداد      | —          | System configuration     |

## Relationships

```
User ──< UserRole >── Role
Role ──< RolePermission >── Permission
User ──< Session
User ──< AuditLog

Product ──> Category
Product ──> Unit
Product ──< Stock >── Warehouse
Product ──< StockMovement
StockMovement ──> Warehouse (from)
StockMovement ──> Warehouse (to)

Sale ──> Customer (optional)
Sale ──< SaleItem >── Product
Sale ──< Payment

Purchase ──> Supplier
Purchase ──< PurchaseItem >── Product

PhysicalInventory ──< PhysicalInventoryItem >── Product

Customer ──< Payment
Supplier ──< Payment
```

## Cardinality

| Relationship               | From                  | To                    | Type                              |
| -------------------------- | --------------------- | --------------------- | --------------------------------- |
| User → Role                | User                  | Role                  | Many-to-Many (via UserRole)       |
| Role → Permission          | Role                  | Permission            | Many-to-Many (via RolePermission) |
| User → Session             | User                  | Session               | One-to-Many                       |
| Product → Category         | Product               | Category              | Many-to-One                       |
| Product → Unit             | Product               | Unit                  | Many-to-One                       |
| Stock → Product            | Stock                 | Product               | Many-to-One                       |
| Stock → Warehouse          | Stock                 | Warehouse             | Many-to-One                       |
| Sale → Customer            | Sale                  | Customer              | Many-to-One (optional)            |
| Sale → SaleItem            | Sale                  | SaleItem              | One-to-Many                       |
| SaleItem → Product         | SaleItem              | Product               | Many-to-One                       |
| Sale → Payment             | Sale                  | Payment               | One-to-Many                       |
| Purchase → Supplier        | Purchase              | Supplier              | Many-to-One                       |
| Purchase → PurchaseItem    | Purchase              | PurchaseItem          | One-to-Many                       |
| PurchaseItem → Product     | PurchaseItem          | Product               | Many-to-One                       |
| PhysicalInventory → PIItem | PhysicalInventory     | PhysicalInventoryItem | One-to-Many                       |
| PIItem → Product           | PhysicalInventoryItem | Product               | Many-to-One                       |

## Entity Lifecycle

### Product Lifecycle

```
Created (draft or active)
  ↓
Active (can be sold, purchased, stocked)
  ↓
Deactivated (soft delete, cannot be sold)
  ↓
Deleted (hard delete, only if no transactions)
```

**Invariants:**

- Product code must be unique
- Product name must not be empty
- Prices must be >= 0
- Buy price must be <= retail price (warning, not enforced)
- Cannot delete product with existing transactions

### Sale Lifecycle

```
Created (draft/placeholder)
  ↓
Items Added (products selected, quantities set)
  ↓
Payment Processed (cash/credit/bank/wallet/check)
  ↓
Completed (stock deducted, payment recorded)
  ↓
[Optional] Returned (partial or full)
```

**Invariants:**

- Must have at least one item
- Quantities must be > 0
- Total = sum of (qty × unitPrice)
- Stock must be available at source location
- Credit sales create customer debt
- Returns restore stock and reverse payment (if cash)

### Purchase Lifecycle

```
Created (draft)
  ↓
Items Added
  ↓
Submitted (sent to supplier)
  ↓
Received (stock added to warehouse)
  ↓
[Optional] Partially Received
```

**Invariants:**

- Must have supplier
- Must have at least one item
- Receiving adds to warehouse only
- Cannot receive more than ordered

### Physical Inventory Lifecycle

```
Created (draft)
  ↓
Counting (items being counted)
  ↓
Completed (all items counted)
  ↓
Reviewed (manager checks variances)
  ↓
Approved (stock adjusted)
```

**Invariants:**

- Only one active count at a time
- Variance = counted - system quantity
- Approval adjusts stock to counted quantities
- Requires reason note for adjustments

### Payment Lifecycle

```
Created
  ↓
Allocated to invoice/customer/supplier
  ↓
Recorded (type: cash/bank/wallet/check)
```

**Invariants:**

- Amount must be > 0
- Must be linked to entity (invoice, customer, supplier)
- Cannot exceed owed amount (warning)
- Payments are append-only (no deletion)

## Business Rules

### Stock Rules

1. **BR-STOCK-001:** Stock cannot go below zero
2. **BR-STOCK-002:** Transfer reduces source, increases destination atomically
3. **BR-STOCK-003:** Sale deducts from specified source (shop or warehouse)
4. **BR-STOCK-004:** Return adds back to specified source
5. **BR-STOCK-005:** Physical inventory overrides stock to counted value

### Pricing Rules

1. **BR-PRICE-001:** Retail price must be >= buy price (warning)
2. **BR-PRICE-002:** Wholesale price <= retail price
3. **BR-PRICE-003:** Special price <= retail price
4. **BR-PRICE-004:** Min profit margin is advisory (warning, not blocking)
5. **BR-PRICE-005:** Selling below cost triggers confirmation

### Invoice Rules

1. **BR-INV-001:** Cash invoice: payment must equal total
2. **BR-INV-002:** Credit invoice: payment can be 0 or partial
3. **BR-INV-003:** Each item quantity must be <= available stock
4. **BR-INV-004:** Service items (no product) are allowed
5. **BR-INV-005:** Returns cannot exceed original quantity

### User Rules

1. **BR-USER-001:** Cannot delete the last active owner
2. **BR-USER-002:** Cannot deactivate yourself
3. **BR-USER-003:** Password must be >= 8 characters
4. **BR-USER-004:** Username must be unique
5. **BR-USER-005:** Each user has exactly one role
