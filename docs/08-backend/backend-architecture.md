# Backend Architecture

## Layer Responsibilities

### Server Actions

```typescript
// Example: Creating a product
"use server";

export async function createProduct(data: CreateProductInput) {
  // 1. Authenticate (get user from session)
  const user = await requireAuth();

  // 2. Authorize (check permission)
  requirePermission(user, "products:create");

  // 3. Validate input
  const validated = createProductSchema.parse(data);

  // 4. Call service
  const product = await productService.create(validated);

  // 5. Audit log
  await auditService.log({
    userId: user.id,
    action: "create",
    resource: "product",
    resourceId: product.id,
  });

  // 6. Return result
  return { success: true, data: product };
}
```

### Application Services

```typescript
// Example: Product service
export class ProductService {
  constructor(private repo: ProductRepository) {}

  async create(input: CreateProductInput): Promise<Product> {
    // Business rule: unique code
    const existing = await this.repo.findByCode(input.code);
    if (existing) {
      throw new BusinessError("PRODUCT_CODE_EXISTS", "كود المنتج موجود مسبقاً");
    }

    // Business rule: prices validation
    if (input.retailPrice < input.buyPrice) {
      throw new BusinessError("PRICE_BELOW_COST", "سعر البيع أقل من تكلفة الشراء");
    }

    // Create product
    return this.repo.create(input);
  }

  async search(query: string, userId: string): Promise<Product[]> {
    // Business rule: cashiers only see active products
    const user = await userService.getById(userId);
    if (user.role === "cashier") {
      return this.repo.searchActive(query);
    }
    return this.repo.search(query);
  }
}
```

### Repository Layer

```typescript
// Example: Product repository
export class ProductRepository {
  constructor(private db: DB) {}

  async findByCode(code: string): Promise<Product | null> {
    return this.db.query.products.findFirst({
      where: eq(products.code, code),
    });
  }

  async search(query: string): Promise<Product[]> {
    return this.db.query.products.findMany({
      where: or(like(products.name, `%${query}%`), like(products.code, `%${query}%`)),
      limit: 50,
    });
  }

  async create(input: CreateProductInput): Promise<Product> {
    const id = generateId("prd");
    await this.db.insert(products).values({ id, ...input });
    return this.findById(id);
  }
}
```

## Authentication Implementation

### Session Management

```typescript
// Server-side session creation
export async function createSession(userId: string) {
  const sessionId = generateId("ses");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Store session in database
  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt: expiresAt.toISOString(),
  });

  // Create JWT
  const token = await new jose.SignJWT({ userId, sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(JWT_SECRET);

  // Set HttpOnly cookie
  cookies().set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 24 * 60 * 60,
  });
}
```

### Middleware Verification

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);

    // Check session exists in database
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, payload.sessionId),
    });

    if (!session) {
      return NextResponse.redirect(new URL("/login?expired=1", request.url));
    }

    // Refresh token if needed
    if (isNearExpiry(session.expiresAt)) {
      await refreshSession(session.id);
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login?expired=1", request.url));
  }
}
```

## Authorization Implementation

### Permission Checking

```typescript
export function requirePermission(user: User, permission: string): void {
  if (user.role === "owner") return; // Owner has all permissions

  const hasPermission = PERMISSIONS[user.role]?.includes(permission);

  if (!hasPermission) {
    throw new AuthorizationError(
      "PERMISSION_DENIED",
      "ليس لديك صلاحية للقيام بهذه العملية",
    );
  }
}
```

### Permission Matrix

```typescript
const PERMISSIONS: Record<string, string[]> = {
  owner: ["*"],
  manager: [
    "dashboard:view",
    "products:create",
    "products:read",
    "products:update",
    "products:delete",
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
    "users:read",
    "users:create",
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
```

## Transaction Boundaries

### When to Use Transactions

| Operation                   | Transaction Required | Reason                                |
| --------------------------- | -------------------- | ------------------------------------- |
| Create sale + deduct stock  | YES                  | Atomic: both succeed or both fail     |
| Stock transfer (out + in)   | YES                  | Atomic: prevents intermediate state   |
| Physical inventory approval | YES                  | Multiple stock updates must be atomic |
| Payment + balance update    | YES                  | Financial integrity                   |
| Create product              | NO                   | Single insert                         |
| Update settings             | NO                   | Single update                         |
| Read queries                | NO                   | No mutation                           |

### Transaction Pattern

```typescript
export async function createSale(input: CreateSaleInput) {
  return db.transaction(async (tx) => {
    // 1. Create sale record
    const sale = await tx.insert(sales).values({...}).returning()

    // 2. Create sale items
    for (const item of input.items) {
      await tx.insert(saleItems).values({
        saleId: sale.id,
        productId: item.productId,
        qty: item.qty,
        price: item.price,
      })

      // 3. Deduct stock
      await tx.update(stocks)
        .set({ qty: sql`${stocks.qty} - ${item.qty}` })
        .where(and(
          eq(stocks.productId, item.productId),
          eq(stocks.location, item.source)
        ))

      // 4. Create stock movement
      await tx.insert(stockMovements).values({
        productId: item.productId,
        qty: -item.qty,
        type: 'SALE',
        referenceId: sale.id,
      })
    }

    // 5. Create payment (if cash)
    if (input.paymentType === 'cash') {
      await tx.insert(payments).values({
        saleId: sale.id,
        amount: input.total,
        type: 'cash',
      })
    }

    return sale
  })
}
```

## Error Handling

### Error Types

```typescript
class BusinessError extends Error {
  constructor(
    public code: string,
    public messageAr: string,
    public status: number = 400,
  ) {
    super(messageAr);
  }
}

class AuthorizationError extends BusinessError {
  constructor(code: string, messageAr: string) {
    super(code, messageAr, 403);
  }
}

class NotFoundError extends BusinessError {
  constructor(code: string, messageAr: string) {
    super(code, messageAr, 404);
  }
}
```

### Error Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
```

## Audit Logging

```typescript
export async function auditLog(input: {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
}) {
  await db.insert(auditLogs).values({
    id: generateId("aud"),
    userId: input.userId,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId,
    details: input.details,
    createdAt: new Date().toISOString(),
  });
}
```

## Rate Limiting

### Login Rate Limiting

```typescript
// Track failed attempts in memory (resets on restart)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

export function checkLoginRateLimit(username: string): boolean {
  const attempts = loginAttempts.get(username);
  if (!attempts) return true;

  // Reset after 15 minutes
  if (Date.now() - attempts.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.delete(username);
    return true;
  }

  // Block after 5 attempts
  return attempts.count < 5;
}
```
