# Performance Architecture

## Performance Budgets

### Hardware Targets

| Spec    | Minimum | Recommended |
| ------- | ------- | ----------- |
| CPU     | 2 cores | 4 cores     |
| RAM     | 4 GB    | 8 GB        |
| Storage | HDD     | SSD         |
| Node.js | 22 LTS  | 22 LTS      |

### Response Time Targets

| Operation           | Target | Acceptable | Critical |
| ------------------- | ------ | ---------- | -------- |
| Page load (initial) | <500ms | <1s        | <3s      |
| Page navigation     | <200ms | <500ms     | <1s      |
| API response        | <50ms  | <100ms     | <200ms   |
| Database query      | <10ms  | <25ms      | <50ms    |
| POS item add        | <100ms | <200ms     | <500ms   |
| Search results      | <100ms | <200ms     | <500ms   |
| Stock check         | <10ms  | <25ms      | <50ms    |
| Report generation   | <500ms | <1s        | <2s      |

### Memory Budgets

| State                 | Target | Acceptable | Critical |
| --------------------- | ------ | ---------- | -------- |
| Idle (no interaction) | <100MB | <150MB     | <200MB   |
| Active (normal use)   | <200MB | <300MB     | <400MB   |
| POS (heavy use)       | <250MB | <350MB     | <500MB   |
| Report generation     | <200MB | <300MB     | <400MB   |

### Bundle Size Budgets

| Bundle        | Target | Acceptable | Critical |
| ------------- | ------ | ---------- | -------- |
| Total JS      | <200KB | <300KB     | <500KB   |
| First Load JS | <100KB | <150KB     | <200KB   |
| POS page      | <80KB  | <120KB     | <180KB   |
| Products page | <50KB  | <80KB      | <120KB   |

## Rendering Performance

### Server Components

- **Default rendering mode** — zero client JavaScript
- **Data fetching on server** — no client-side waterfalls
- **Streaming** — progressive rendering for slow queries

### Client Components

- **Lazy loading** — dynamic imports for non-critical components
- **Memoization** — `React.memo` for expensive renders
- **Virtualization** — for large lists (products, invoices)

### React Patterns

```typescript
// ✅ GOOD: Memoize expensive computations
const filteredProducts = useMemo(() =>
  products.filter(p => p.name.includes(search)),
  [products, search]
)

// ✅ GOOD: Lazy load heavy components
const ReportChart = dynamic(() => import('./report-chart'), {
  loading: () => <Skeleton className="h-[300px]" />,
})

// ❌ BAD: Unnecessary re-renders
function ProductList({ products }) {
  return products.map(p => <ProductRow product={p} />) // Re-renders all on any change
}

// ✅ GOOD: Stable references
const ProductList = React.memo(({ products }) => {
  return products.map(p => <ProductRow key={p.id} product={p} />)
})
```

## Database Performance

### Indexing Strategy

- **Primary keys** — Always indexed (automatic)
- **Foreign keys** — Indexed for JOIN performance
- **Search columns** — Indexed for LIKE queries
- **Date columns** — Indexed for range queries
- **Status columns** — Indexed for filtered queries

### Query Optimization

```typescript
// ✅ GOOD: Select specific fields
const products = await db.query.products.findMany({
  columns: { id: true, name: true, code: true },
  limit: 50,
});

// ❌ BAD: Select all fields
const products = await db.query.products.findMany();

// ✅ GOOD: Use indexes
const products = await db.query.products.findMany({
  where: like(products.name, `%${search}%`), // indexed
  limit: 50,
});

// ✅ GOOD: Pagination
const products = await db.query.products.findMany({
  limit: 20,
  offset: (page - 1) * 20,
});
```

### WAL Mode Benefits

- **Concurrent reads** — Multiple reads during writes
- **Write performance** — Sequential writes to WAL
- **Crash recovery** — WAL replay on startup
- **Checkpointing** — Periodic WAL merge into main DB

## Client Performance

### Code Splitting

```typescript
// Route-based splitting (automatic with App Router)
// Component-based splitting (manual)
const POS = dynamic(() => import('@/features/sales/components/pos'), {
  loading: () => <POSSkeleton />,
  ssr: false, // POS is client-only
})
```

### Image Optimization

- **No images in current scope** — Products are text-only
- **Future:** Use Next.js `Image` component for product images

### Font Optimization

```typescript
// Use next/font for automatic optimization
import { IBM_Plex_Sans_Arabic } from "next/font/google";

const arabicFont = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  display: "swap",
});
```

## Monitoring

### Metrics to Track

| Metric              | Tool                   | Alert Threshold |
| ------------------- | ---------------------- | --------------- |
| Page load time      | Lighthouse             | >1s             |
| API response time   | Custom logging         | >100ms          |
| Database query time | Drizzle logging        | >50ms           |
| Memory usage        | Node.js process        | >300MB          |
| Bundle size         | Webpack analyzer       | >300KB          |
| Error rate          | Error boundary logging | >1%             |

### Performance Testing

```typescript
// Database performance test
describe("Database Performance", () => {
  it("should search 10000 products in <50ms", async () => {
    const start = Date.now();
    await service.search("product", { limit: 50 });
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(50);
  });
});
```

## Optimization Checklist

### Before Each Phase

- [ ] Bundle size within budget
- [ ] No unnecessary client components
- [ ] Database queries optimized
- [ ] Indexes created for new queries
- [ ] Memory usage within budget
- [ ] Response times within targets
- [ ] No memory leaks (event listeners cleaned up)
- [ ] Lazy loading for heavy components

### Before Production

- [ ] Lighthouse score >90
- [ ] All response times within targets
- [ ] Memory usage stable over 30 minutes
- [ ] Bundle size within budget
- [ ] Database WAL checkpointing working
- [ ] No console errors in production
