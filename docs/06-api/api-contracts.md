# API Contract Plan

## Response Format

All API endpoints return a consistent envelope:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## API Endpoints

### Authentication

| ID           | Method | Path                        | Purpose             | Auth | Permission |
| ------------ | ------ | --------------------------- | ------------------- | ---- | ---------- |
| API-AUTH-001 | POST   | `/api/auth/login`           | Login               | No   | —          |
| API-AUTH-002 | POST   | `/api/auth/logout`          | Logout              | Yes  | —          |
| API-AUTH-003 | GET    | `/api/auth/session`         | Get current session | Yes  | —          |
| API-AUTH-004 | POST   | `/api/auth/change-password` | Change password     | Yes  | —          |

### Users

| ID           | Method | Path                            | Purpose         | Auth | Permission     |
| ------------ | ------ | ------------------------------- | --------------- | ---- | -------------- |
| API-USER-001 | GET    | `/api/users`                    | List users      | Yes  | `users:read`   |
| API-USER-002 | POST   | `/api/users`                    | Create user     | Yes  | `users:create` |
| API-USER-003 | GET    | `/api/users/:id`                | Get user        | Yes  | `users:read`   |
| API-USER-004 | PUT    | `/api/users/:id`                | Update user     | Yes  | `users:update` |
| API-USER-005 | DELETE | `/api/users/:id`                | Deactivate user | Yes  | `users:update` |
| API-USER-006 | POST   | `/api/users/:id/reset-password` | Reset password  | Yes  | `users:update` |

### Products

| ID           | Method | Path                     | Purpose               | Auth | Permission        |
| ------------ | ------ | ------------------------ | --------------------- | ---- | ----------------- |
| API-PROD-001 | GET    | `/api/products`          | List products         | Yes  | `products:read`   |
| API-PROD-002 | POST   | `/api/products`          | Create product        | Yes  | `products:create` |
| API-PROD-003 | GET    | `/api/products/:id`      | Get product           | Yes  | `products:read`   |
| API-PROD-004 | PUT    | `/api/products/:id`      | Update product        | Yes  | `products:update` |
| API-PROD-005 | DELETE | `/api/products/:id`      | Delete product        | Yes  | `products:delete` |
| API-PROD-006 | GET    | `/api/products/search`   | Search products       | Yes  | `products:read`   |
| API-PROD-007 | GET    | `/api/products/metadata` | Get categories, units | Yes  | `products:read`   |

### Categories

| ID          | Method | Path                  | Purpose         | Auth | Permission        |
| ----------- | ------ | --------------------- | --------------- | ---- | ----------------- |
| API-CAT-001 | GET    | `/api/categories`     | List categories | Yes  | `products:read`   |
| API-CAT-002 | POST   | `/api/categories`     | Create category | Yes  | `products:create` |
| API-CAT-003 | PUT    | `/api/categories/:id` | Update category | Yes  | `products:update` |
| API-CAT-004 | DELETE | `/api/categories/:id` | Delete category | Yes  | `products:delete` |

### Stock

| ID            | Method | Path                    | Purpose           | Auth | Permission       |
| ------------- | ------ | ----------------------- | ----------------- | ---- | ---------------- |
| API-STOCK-001 | GET    | `/api/stock`            | List stock levels | Yes  | `stock:read`     |
| API-STOCK-002 | GET    | `/api/stock/:productId` | Get product stock | Yes  | `stock:read`     |
| API-STOCK-003 | POST   | `/api/stock/transfer`   | Transfer stock    | Yes  | `stock:transfer` |
| API-STOCK-004 | POST   | `/api/stock/adjust`     | Adjust stock      | Yes  | `stock:manage`   |
| API-STOCK-005 | GET    | `/api/stock/movements`  | List movements    | Yes  | `stock:read`     |

### Sales

| ID           | Method | Path                    | Purpose         | Auth | Permission        |
| ------------ | ------ | ----------------------- | --------------- | ---- | ----------------- |
| API-SALE-001 | GET    | `/api/sales`            | List invoices   | Yes  | `invoices:read`   |
| API-SALE-002 | POST   | `/api/sales`            | Create invoice  | Yes  | `invoices:create` |
| API-SALE-003 | GET    | `/api/sales/:id`        | Get invoice     | Yes  | `invoices:read`   |
| API-SALE-004 | DELETE | `/api/sales/:id`        | Cancel invoice  | Yes  | `invoices:delete` |
| API-SALE-005 | POST   | `/api/sales/:id/return` | Process return  | Yes  | `invoices:return` |
| API-SALE-006 | GET    | `/api/sales/stats`      | Get sales stats | Yes  | `invoices:read`   |

### Purchases

| ID          | Method | Path                         | Purpose         | Auth | Permission         |
| ----------- | ------ | ---------------------------- | --------------- | ---- | ------------------ |
| API-PUR-001 | GET    | `/api/purchases`             | List purchases  | Yes  | `purchases:read`   |
| API-PUR-002 | POST   | `/api/purchases`             | Create purchase | Yes  | `purchases:create` |
| API-PUR-003 | GET    | `/api/purchases/:id`         | Get purchase    | Yes  | `purchases:read`   |
| API-PUR-004 | PUT    | `/api/purchases/:id`         | Update purchase | Yes  | `purchases:update` |
| API-PUR-005 | DELETE | `/api/purchases/:id`         | Cancel purchase | Yes  | `purchases:delete` |
| API-PUR-006 | POST   | `/api/purchases/:id/receive` | Receive stock   | Yes  | `stock:manage`     |

### Customers

| ID           | Method | Path                          | Purpose           | Auth | Permission         |
| ------------ | ------ | ----------------------------- | ----------------- | ---- | ------------------ |
| API-CUST-001 | GET    | `/api/customers`              | List customers    | Yes  | `customers:read`   |
| API-CUST-002 | POST   | `/api/customers`              | Create customer   | Yes  | `customers:create` |
| API-CUST-003 | GET    | `/api/customers/:id`          | Get customer      | Yes  | `customers:read`   |
| API-CUST-004 | PUT    | `/api/customers/:id`          | Update customer   | Yes  | `customers:update` |
| API-CUST-005 | GET    | `/api/customers/:id/invoices` | Customer invoices | Yes  | `customers:read`   |
| API-CUST-006 | GET    | `/api/customers/:id/payments` | Customer payments | Yes  | `customers:read`   |

### Suppliers

| ID           | Method | Path                 | Purpose         | Auth | Permission         |
| ------------ | ------ | -------------------- | --------------- | ---- | ------------------ |
| API-SUPP-001 | GET    | `/api/suppliers`     | List suppliers  | Yes  | `suppliers:read`   |
| API-SUPP-002 | POST   | `/api/suppliers`     | Create supplier | Yes  | `suppliers:create` |
| API-SUPP-003 | GET    | `/api/suppliers/:id` | Get supplier    | Yes  | `suppliers:read`   |
| API-SUPP-004 | PUT    | `/api/suppliers/:id` | Update supplier | Yes  | `suppliers:update` |

### Payments

| ID          | Method | Path                | Purpose        | Auth | Permission         |
| ----------- | ------ | ------------------- | -------------- | ---- | ------------------ |
| API-PAY-001 | GET    | `/api/payments`     | List payments  | Yes  | `financial:read`   |
| API-PAY-002 | POST   | `/api/payments`     | Record payment | Yes  | `financial:manage` |
| API-PAY-003 | GET    | `/api/payments/:id` | Get payment    | Yes  | `financial:read`   |

### Financial

| ID          | Method | Path                     | Purpose            | Auth | Permission         |
| ----------- | ------ | ------------------------ | ------------------ | ---- | ------------------ |
| API-FIN-001 | GET    | `/api/finance/treasury`  | Treasury movements | Yes  | `financial:read`   |
| API-FIN-002 | GET    | `/api/finance/debts`     | Debt center        | Yes  | `financial:read`   |
| API-FIN-003 | POST   | `/api/finance/movements` | Manual entry       | Yes  | `financial:manage` |

### Physical Inventory

| ID          | Method | Path                                   | Purpose        | Auth | Permission                  |
| ----------- | ------ | -------------------------------------- | -------------- | ---- | --------------------------- |
| API-PHY-001 | GET    | `/api/physical-inventory`              | List counts    | Yes  | `physical_inventory:manage` |
| API-PHY-002 | POST   | `/api/physical-inventory`              | Create count   | Yes  | `physical_inventory:manage` |
| API-PHY-003 | GET    | `/api/physical-inventory/:id`          | Get count      | Yes  | `physical_inventory:manage` |
| API-PHY-004 | PUT    | `/api/physical-inventory/:id`          | Update count   | Yes  | `physical_inventory:manage` |
| API-PHY-005 | POST   | `/api/physical-inventory/:id/complete` | Complete count | Yes  | `physical_inventory:manage` |
| API-PHY-006 | POST   | `/api/physical-inventory/:id/approve`  | Approve count  | Yes  | `physical_inventory:manage` |

### Reports

| ID          | Method | Path                     | Purpose            | Auth | Permission     |
| ----------- | ------ | ------------------------ | ------------------ | ---- | -------------- |
| API-REP-001 | GET    | `/api/reports/sales`     | Sales report       | Yes  | `reports:view` |
| API-REP-002 | GET    | `/api/reports/financial` | Financial report   | Yes  | `reports:view` |
| API-REP-003 | GET    | `/api/reports/profit`    | Profit by customer | Yes  | `reports:view` |
| API-REP-004 | GET    | `/api/reports/prices`    | Price history      | Yes  | `reports:view` |
| API-REP-005 | GET    | `/api/reports/shortages` | Shortage report    | Yes  | `reports:view` |

### Settings

| ID          | Method | Path            | Purpose         | Auth | Permission        |
| ----------- | ------ | --------------- | --------------- | ---- | ----------------- |
| API-SET-001 | GET    | `/api/settings` | Get settings    | Yes  | `settings:read`   |
| API-SET-002 | PUT    | `/api/settings` | Update settings | Yes  | `settings:update` |

### Backup

| ID           | Method | Path                  | Purpose        | Auth | Permission       |
| ------------ | ------ | --------------------- | -------------- | ---- | ---------------- |
| API-BKUP-001 | POST   | `/api/backup/create`  | Create backup  | Yes  | `backup:create`  |
| API-BKUP-002 | POST   | `/api/backup/restore` | Restore backup | Yes  | `backup:restore` |
| API-BKUP-003 | GET    | `/api/backup/list`    | List backups   | Yes  | `backup:create`  |

### Audit

| ID          | Method | Path         | Purpose         | Auth | Permission   |
| ----------- | ------ | ------------ | --------------- | ---- | ------------ |
| API-AUD-001 | GET    | `/api/audit` | List audit logs | Yes  | `audit:view` |

## Server Actions

### Preferred over API Routes

For form submissions, Server Actions are preferred over API routes:

```typescript
// actions/product.actions.ts
"use server";

export async function createProductAction(formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    code: formData.get("code") as string,
    buyPrice: Number(formData.get("buyPrice")),
    retailPrice: Number(formData.get("retailPrice")),
  };

  // Validate, authorize, execute
  const result = await productService.create(data);

  // Revalidate cache
  revalidatePath("/inventory/products");

  return result;
}
```

### When to Use API Routes vs Server Actions

| Scenario             | Use              | Reason                       |
| -------------------- | ---------------- | ---------------------------- |
| Form submission      | Server Action    | Simpler, built-in CSRF       |
| Data fetching        | Server Component | No client JS needed          |
| Real-time search     | API Route        | Client-side TanStack Query   |
| File upload          | Server Action    | FormData support             |
| Complex mutations    | Server Action    | Transaction support          |
| External integration | API Route        | Need response format control |

## Rate Limiting

| Endpoint    | Limit        | Window     |
| ----------- | ------------ | ---------- |
| Login       | 5 attempts   | 15 minutes |
| General API | 100 requests | 1 minute   |
| Reports     | 10 requests  | 1 minute   |
| Backup      | 3 requests   | 1 hour     |
