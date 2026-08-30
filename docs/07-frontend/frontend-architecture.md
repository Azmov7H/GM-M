# Frontend Architecture

## Rendering Strategy

### Server Components (Default)

Every component is a Server Component unless it explicitly needs client-side interactivity.

**Use Server Components for:**

- Page layouts and structure
- Data fetching (products, invoices, stock)
- Static content (labels, headings, descriptions)
- Data tables (read-only display)
- Dashboard cards and summaries
- Navigation components

### Client Components (Exception)

Mark with `'use client'` only when the component needs:

- `useState` / `useReducer` (local state)
- `useEffect` (side effects)
- Event handlers (`onClick`, `onSubmit`, `onChange`)
- Browser APIs (`window`, `document`, `localStorage`)
- Custom hooks using the above

**Use Client Components for:**

- Forms (React Hook Form)
- Dialogs and modals
- Dropdown menus
- Search with debounce
- POS cart management
- Interactive charts
- Toast notifications

## State Management

### Server State (TanStack Query)

```typescript
// Query keys follow a hierarchical pattern
const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ProductListParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  stock: (id: string) => [...productKeys.all, "stock", id] as const,
};

// Usage in components
const { data, isLoading } = useQuery({
  queryKey: productKeys.list({ search, page }),
  queryFn: () => fetchProducts({ search, page }),
});
```

### Client State (React)

```typescript
// Local state for UI interactions only
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
const [selectedRow, setSelectedRow] = useState<string | null>(null);
```

### Form State (React Hook Form)

```typescript
const form = useForm<CreateProductInput>({
  resolver: zodResolver(createProductSchema),
  defaultValues: {
    name: "",
    code: "",
    buyPrice: 0,
    retailPrice: 0,
  },
});
```

## Form Architecture

### Pattern: React Hook Form + Zod + Server Actions

```typescript
// features/products/schemas/product.schema.ts
export const createProductSchema = z.object({
  name: z.string().min(3, 'اسم المنتج يجب أن يكون 3 أحرف على الأقل'),
  code: z.string().min(1, 'كود المنتج مطلوب'),
  buyPrice: z.number().min(0, 'سعر الشراء لا يمكن أن يكون سالباً'),
  retailPrice: z.number().min(0, 'سعر البيع لا يمكن أن يكون سالباً'),
  categoryId: z.string().optional(),
  unitId: z.string().optional(),
})

// features/products/components/product-form.tsx
'use client'

export function ProductForm({ onSuccess }: { onSuccess: () => void }) {
  const createProduct = useMutation({
    mutationFn: (data: CreateProductInput) =>
      fetch('/api/products', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success('تم إنشاء المنتج بنجاح')
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => createProduct.mutate(data))}>
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>اسم المنتج</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        {/* More fields... */}
        <Button type="submit" disabled={createProduct.isPending}>
          {createProduct.isPending ? 'جاري الإنشاء...' : 'إنشاء'}
        </Button>
      </form>
    </Form>
  )
}
```

## Data Fetching Patterns

### Server Component (Default)

```typescript
// app/(main)/inventory/products/page.tsx
import { ProductList } from '@/features/products/components/product-list'

export default async function ProductsPage() {
  // This runs on the server
  const products = await productService.findAll()

  return <ProductList products={products} />
}
```

### Client Component (TanStack Query)

```typescript
// features/products/components/product-search.tsx
'use client'

export function ProductSearch() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  const { data, isLoading } = useQuery({
    queryKey: productKeys.list({ search: debouncedQuery }),
    queryFn: () => searchProducts(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  })

  return (
    <div>
      <Input
        placeholder="بحث عن منتج..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {isLoading && <Skeleton />}
      {data && (
        <div>
          {data.map(product => (
            <div key={product.id}>{product.name}</div>
          ))}
        </div>
      )}
    </div>
  )
}
```

## Error Boundaries

```typescript
// app/(main)/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-2xl font-bold mb-4">حدث خطأ</h2>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <Button onClick={reset}>حاول مرة أخرى</Button>
    </div>
  )
}
```

## Loading States

```typescript
// app/(main)/inventory/products/loading.tsx
export default function ProductsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}
```

## Empty States

```typescript
// components/shared/empty-state.tsx
export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string
  description: string
  icon: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
      <div className="text-muted-foreground mb-4">{icon}</div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {action}
    </div>
  )
}
```

## Caching Strategy

| Data Type     | Cache Duration | Strategy                      |
| ------------- | -------------- | ----------------------------- |
| Product list  | 5 minutes      | Stale-while-revalidate        |
| Stock levels  | 1 minute       | Frequent revalidation         |
| Customer list | 5 minutes      | Stale-while-revalidate        |
| Settings      | 30 minutes     | Long cache, manual invalidate |
| Session       | 5 minutes      | Refetch on window focus       |
| Reports       | 10 minutes     | Long cache, manual refresh    |

## Bundle Optimization

### Code Splitting

```typescript
// Dynamic import for heavy components
const ReportChart = dynamic(() => import('@/features/reports/components/report-chart'), {
  loading: () <Skeleton className="h-[300px] w-full" />,
  ssr: false,
})

// Lazy POS only when accessed
const POSPage = dynamic(() => import('@/features/sales/components/pos-page'))
```

### Tree Shaking

- Import only needed Lucide icons: `import { Plus } from 'lucide-react'`
- Import only needed shadcn components
- Avoid barrel exports from features

## RTL Implementation

```typescript
// All directional utilities use logical properties
// GOOD:
<div className="ms-4"> {/* margin-start (right in RTL) */}
<div className="pe-2"> {/* padding-end (left in RTL) */}
<div className="text-start"> {/* text-align: right in RTL */}

// BAD (never use):
<div className="ml-4"> {/* ❌ */}
<div className="pr-2"> {/* ❌ */}
<div className="text-left"> {/* ❌ */}
```
