# Testing Strategy

## Testing Pyramid

```
         ╱╲
        ╱  ╲
       ╱ E2E╲         Few, critical paths
      ╱──────╲
     ╱ Integr.╲       Services + DB
    ╱──────────╲
   ╱   Unit     ╲     Business logic, utilities
  ╱──────────────╲
```

## Unit Tests

### Scope

- Application services (business logic)
- Zod validation schemas
- Utility functions
- Permission checking logic
- Price calculation functions
- Stock calculation functions

### Tools

- Vitest 3.x
- In-memory SQLite for repository tests

### Test IDs

| ID            | Feature                     | File                                                    |
| ------------- | --------------------------- | ------------------------------------------------------- |
| TEST-UNIT-001 | Product creation validation | `features/products/__tests__/product.service.test.ts`   |
| TEST-UNIT-002 | Invoice total calculation   | `features/sales/__tests__/invoice.service.test.ts`      |
| TEST-UNIT-003 | Stock deduction logic       | `features/inventory/__tests__/stock.service.test.ts`    |
| TEST-UNIT-004 | Permission checking         | `server/auth/__tests__/permissions.test.ts`             |
| TEST-UNIT-005 | Price validation            | `features/products/__tests__/price.test.ts`             |
| TEST-UNIT-006 | User creation validation    | `features/users/__tests__/user.service.test.ts`         |
| TEST-UNIT-007 | Payment allocation          | `features/customers/__tests__/payment.service.test.ts`  |
| TEST-UNIT-008 | Transfer validation         | `features/inventory/__tests__/transfer.service.test.ts` |
| TEST-UNIT-009 | Physical inventory variance | `features/inventory/__tests__/physical.service.test.ts` |
| TEST-UNIT-010 | Zod schemas                 | `features/*/schemas/__tests__/schema.test.ts`           |

### Example Unit Test

```typescript
import { describe, it, expect } from "vitest";
import { calculateInvoiceTotal } from "../invoice.service";

describe("calculateInvoiceTotal", () => {
  it("should calculate total for single item", () => {
    const items = [{ qty: 2, unitPrice: 100 }];
    const result = calculateInvoiceTotal(items);
    expect(result.subtotal).toBe(200);
    expect(result.total).toBe(200);
  });

  it("should apply discount", () => {
    const items = [{ qty: 1, unitPrice: 100 }];
    const result = calculateInvoiceTotal(items, { discount: 10 });
    expect(result.discount).toBe(10);
    expect(result.total).toBe(90);
  });

  it("should reject zero quantity", () => {
    const items = [{ qty: 0, unitPrice: 100 }];
    expect(() => calculateInvoiceTotal(items)).toThrow();
  });
});
```

## Integration Tests

### Scope

- Services + Repository + Database
- Server Actions + Services
- Authentication flow
- Authorization checks

### Tools

- Vitest 3.x
- In-memory SQLite (test database)

### Test IDs

| ID           | Feature                         | File                                                        |
| ------------ | ------------------------------- | ----------------------------------------------------------- |
| TEST-INT-001 | Product CRUD                    | `features/products/__tests__/product.integration.test.ts`   |
| TEST-INT-002 | Sale creation + stock deduction | `features/sales/__tests__/sale.integration.test.ts`         |
| TEST-INT-003 | Stock transfer                  | `features/inventory/__tests__/transfer.integration.test.ts` |
| TEST-INT-004 | Login session                   | `features/auth/__tests__/session.integration.test.ts`       |
| TEST-INT-005 | Permission enforcement          | `server/auth/__tests__/rbac.integration.test.ts`            |
| TEST-INT-006 | Physical inventory workflow     | `features/inventory/__tests__/physical.integration.test.ts` |
| TEST-INT-007 | Payment + balance update        | `features/customers/__tests__/payment.integration.test.ts`  |
| TEST-INT-008 | Purchase receiving              | `features/purchases/__tests__/purchase.integration.test.ts` |

### Example Integration Test

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { createTestDatabase, seedTestData } from "@/__tests__/helpers";
import { ProductService } from "../product.service";
import { ProductRepository } from "../product.repository";

describe("ProductService Integration", () => {
  let service: ProductService;
  let db: TestDatabase;

  beforeEach(async () => {
    db = await createTestDatabase();
    await seedTestData(db);
    const repo = new ProductRepository(db);
    service = new ProductService(repo);
  });

  it("should create product and find by code", async () => {
    const product = await service.create({
      name: "منتج تجريبي",
      code: "TEST001",
      buyPrice: 50,
      retailPrice: 100,
    });

    const found = await service.findByCode("TEST001");
    expect(found).toBeDefined();
    expect(found.name).toBe("منتج تجريبي");
  });

  it("should reject duplicate product code", async () => {
    await service.create({ name: "أول", code: "DUP001", buyPrice: 10, retailPrice: 20 });

    await expect(
      service.create({ name: "ثاني", code: "DUP001", buyPrice: 10, retailPrice: 20 }),
    ).rejects.toThrow("كود المنتج موجود مسبقاً");
  });
});
```

## E2E Tests

### Scope

- Complete user workflows
- Critical business flows
- Cross-browser testing

### Tools

- Playwright 1.x
- Chromium (primary), Firefox, WebKit

### Test IDs

| ID           | Flow                  | File                                    |
| ------------ | --------------------- | --------------------------------------- |
| TEST-E2E-001 | Login → Dashboard     | `e2e/auth/login.spec.ts`                |
| TEST-E2E-002 | Create product        | `e2e/products/create-product.spec.ts`   |
| TEST-E2E-003 | Complete POS sale     | `e2e/sales/pos-sale.spec.ts`            |
| TEST-E2E-004 | Process return        | `e2e/sales/return-sale.spec.ts`         |
| TEST-E2E-005 | Stock transfer        | `e2e/inventory/transfer.spec.ts`        |
| TEST-E2E-006 | Physical inventory    | `e2e/inventory/physical-count.spec.ts`  |
| TEST-E2E-007 | Create purchase order | `e2e/purchases/create-purchase.spec.ts` |
| TEST-E2E-008 | Customer payment      | `e2e/customers/payment.spec.ts`         |
| TEST-E2E-009 | View reports          | `e2e/reports/view-reports.spec.ts`      |
| TEST-E2E-010 | Backup and restore    | `e2e/admin/backup-restore.spec.ts`      |
| TEST-E2E-011 | Role-based access     | `e2e/auth/rbac.spec.ts`                 |
| TEST-E2E-012 | Arabic RTL layout     | `e2e/ui/rtl-layout.spec.ts`             |

### Example E2E Test

```typescript
import { test, expect } from "@playwright/test";

test.describe("POS Sale Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login as cashier
    await page.goto("/login");
    await page.fill('[name="username"]', "cashier1");
    await page.fill('[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/");
  });

  test("should complete a cash sale", async ({ page }) => {
    // Navigate to POS
    await page.click("text=نقطة البيع");
    await expect(page).toHaveURL("/sales/pos");

    // Search for product
    await page.fill('[placeholder="بحث عن منتج..."]', "منتج");
    await page.waitForSelector('[data-testid="product-item"]');
    await page.click('[data-testid="product-item"]:first-child');

    // Verify product added to cart
    await expect(page.locator('[data-testid="cart-item"]')).toHaveLength(1);

    // Process payment
    await page.click("text=إتمام البيع");
    await expect(page.locator("text=تمت العملية بنجاح")).toBeVisible();
  });
});
```

## Security Tests

### Scope

- Authentication bypass attempts
- Authorization escalation
- Input validation
- Session management

### Test IDs

| ID           | Test                           | File                                   |
| ------------ | ------------------------------ | -------------------------------------- |
| TEST-SEC-001 | Unauthenticated access blocked | `e2e/security/unauthenticated.spec.ts` |
| TEST-SEC-002 | Unauthorized action blocked    | `e2e/security/unauthorized.spec.ts`    |
| TEST-SEC-003 | SQL injection prevented        | `e2e/security/sql-injection.spec.ts`   |
| TEST-SEC-004 | XSS prevented                  | `e2e/security/xss.spec.ts`             |
| TEST-SEC-005 | Session expiry works           | `e2e/security/session-expiry.spec.ts`  |
| TEST-SEC-006 | CSRF protection                | `e2e/security/csrf.spec.ts`            |

## Performance Tests

### Scope

- Page load times on target hardware
- Database query performance
- Memory usage
- Bundle size

### Test IDs

| ID            | Test                  | Tool             |
| ------------- | --------------------- | ---------------- |
| TEST-PERF-001 | Page load < 1s        | Lighthouse       |
| TEST-PERF-002 | API response < 100ms  | Custom script    |
| TEST-PERF-003 | Database query < 50ms | Vitest           |
| TEST-PERF-004 | Bundle size < 300KB   | Webpack analyzer |
| TEST-PERF-005 | Memory < 200MB        | Chrome DevTools  |

## Test Helpers

### Database Helpers

```typescript
// __tests__/helpers.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

export async function createTestDatabase() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");

  // Run migrations
  await migrate(drizzle(sqlite), { migrationsFolder: "./drizzle" });

  return drizzle(sqlite);
}

export async function seedTestData(db: DB) {
  // Insert default roles and permissions
  await db.insert(roles).values([
    { id: "role_owner", name: "owner", description: "المالك" },
    { id: "role_manager", name: "manager", description: "المدير" },
    { id: "role_cashier", name: "cashier", description: "أمين الصندوق" },
    { id: "role_warehouse", name: "warehouse", description: "أمين المخزون" },
    { id: "role_viewer", name: "viewer", description: "مشاهد" },
  ]);

  // Insert test user
  await db.insert(users).values({
    id: "usr_test",
    username: "testuser",
    passwordHash: await hash("password123", 12),
    displayName: "مستخدم تجريبي",
  });
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npx playwright install
      - run: npm run test:e2e
```

## Test Coverage Targets

| Area               | Target | Minimum |
| ------------------ | ------ | ------- |
| Services           | 90%    | 80%     |
| Schemas            | 100%   | 95%     |
| Utilities          | 95%    | 85%     |
| E2E Critical Flows | 100%   | 100%    |
| Overall            | 80%    | 70%     |
