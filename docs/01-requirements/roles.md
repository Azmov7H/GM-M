# User Roles

## Role System Design

| Role      | Arabic       | Purpose                        | Access Level       |
| --------- | ------------ | ------------------------------ | ------------------ |
| Owner     | المالك       | Full system control            | `['*']` (wildcard) |
| Manager   | المدير       | Business operations management | High               |
| Cashier   | أمين الصندوق | POS and invoice operations     | Limited            |
| Warehouse | أمين المخزون | Stock management operations    | Limited            |
| Viewer    | م VIEWONLY   | Read-only access               | Minimal            |

## Role Definitions

### Owner (المالك)

**Purpose:** Business owner with unrestricted access.

**Permissions:**

- `*` (wildcard — all permissions)

**Allowed Modules:** All modules

**Sensitive Operations:**

- User creation/deletion
- Password resets
- System settings changes
- Financial data access
- Audit log viewing
- Database backup/restore

**Approval Requirements:** None (full access)

---

### Manager (المدير)

**Purpose:** Day-to-day business operations manager.

**Permissions:**

- `dashboard:view`
- `products:create`, `products:read`, `products:update`, `products:delete`
- `categories:manage`
- `stock:read`, `stock:manage`, `stock:transfer`
- `physical_inventory:manage`
- `invoices:create`, `invoices:read`, `invoices:update`, `invoices:delete`, `invoices:return`
- `purchases:create`, `purchases:read`, `purchases:update`, `purchases:delete`
- `customers:create`, `customers:read`, `customers:update`
- `suppliers:create`, `suppliers:read`, `suppliers:update`
- `financial:read`, `financial:manage`
- `reports:view`
- `users:read`, `users:create`, `users:update`
- `settings:read`, `settings:update`
- `audit:view`

**Allowed Modules:** All except system-level admin (owner-only operations)

**Sensitive Operations:**

- Stock adjustments (audit-style)
- Financial entries
- User management
- Settings changes

**Approval Requirements:** None

---

### Cashier (أمين الصندوق)

**Purpose:** POS operator handling sales and customer interactions.

**Permissions:**

- `dashboard:view`
- `products:read`, `products:read_stock`
- `invoices:create`, `invoices:read`
- `customers:read`

**Allowed Modules:** Dashboard, POS, Invoice List, Products (read-only), Customers (read-only)

**Sensitive Operations:**

- Cannot modify prices below cost (warning only)
- Cannot delete invoices
- Cannot access financial reports
- Cannot manage users

**Approval Requirements:** Returns require manager approval

---

### Warehouse (أمين المخزون)

**Purpose:** Inventory and stock management.

**Permissions:**

- `dashboard:view`
- `products:read`, `products:read_stock`
- `stock:read`, `stock:manage`
- `stock:transfer`
- `physical_inventory:manage`
- `categories:read`

**Allowed Modules:** Dashboard, Products (read), Stock, Stock Movements, Physical Inventory, Transfers

**Sensitive Operations:**

- Stock adjustments (with reason)
- Stock transfers
- Physical inventory counts

**Approval Requirements:** Stock adjustments require manager notification

---

### Viewer (مشاهد)

**Purpose:** Read-only access for monitoring and reporting.

**Permissions:**

- `dashboard:view`
- `products:read`, `products:read_stock`
- `stock:read`
- `reports:view`

**Allowed Modules:** Dashboard, Products (read), Stock (read), Reports (read)

**Sensitive Operations:** None — read-only

**Approval Requirements:** None

---

## Permission Definitions

### Resource:Action Format

All permissions follow the `resource:action` pattern:

| Resource             | Actions                                            |
| -------------------- | -------------------------------------------------- |
| `dashboard`          | `view`                                             |
| `products`           | `create`, `read`, `update`, `delete`, `read_stock` |
| `categories`         | `manage`, `read`                                   |
| `stock`              | `read`, `manage`, `transfer`                       |
| `physical_inventory` | `manage`                                           |
| `invoices`           | `create`, `read`, `update`, `delete`, `return`     |
| `purchases`          | `create`, `read`, `update`, `delete`               |
| `customers`          | `create`, `read`, `update`, `delete`               |
| `suppliers`          | `create`, `read`, `update`, `delete`               |
| `financial`          | `read`, `manage`                                   |
| `reports`            | `view`                                             |
| `users`              | `create`, `read`, `update`, `delete`               |
| `settings`           | `read`, `update`                                   |
| `audit`              | `view`                                             |
| `backup`             | `create`, `restore`                                |

### RBAC Enforcement

**Server-side (mandatory):**

- Every Server Action and Route Handler must verify permissions
- `requirePermission(user, 'resource:action')` throws if unauthorized
- No data is returned to unauthorized clients

**Client-side (UX only):**

- `<RoleGate roles={[...]}>` hides UI elements
- This is cosmetic only — server must always enforce

## Task IDs

| Role      | Definition Task | Implementation Task |
| --------- | --------------- | ------------------- |
| Owner     | TASK-AUTH-002   | TASK-AUTH-010       |
| Manager   | TASK-AUTH-002   | TASK-AUTH-010       |
| Cashier   | TASK-AUTH-002   | TASK-AUTH-010       |
| Warehouse | TASK-AUTH-002   | TASK-AUTH-010       |
| Viewer    | TASK-AUTH-002   | TASK-AUTH-010       |
