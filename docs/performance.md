# Performance

## Target Hardware

```
CPU: 2-4 cores
RAM: 4-8 GB
Storage: SSD
```

## Rendering Strategy

- **Server Components by default** - Minimal client-side JavaScript
- **Client Components only** - For interactive elements (forms, dialogs)
- **No unnecessary re-renders** - Proper React patterns

## Database Performance

- **WAL mode** - Concurrent reads without blocking writes
- **Proper indexes** - On frequently queried columns
- **Selective fields** - Never SELECT * in production
- **Pagination** - All list views paginated
- **Controlled joins** - Avoid N+1 queries

## UI Performance

- **Pagination** - All data tables paginated
- **Debounced search** - Avoid excessive API calls
- **Skeleton loading** - Perceived performance
- **Lazy loading** - Where appropriate
- **Minimal animations** - Performance-friendly transitions

## Bundle Optimization

- **Server Components** - Zero client JavaScript
- **Code splitting** - Automatic with App Router
- **Tree shaking** - Only import what's needed
- **Minimal dependencies** - Each dependency adds weight

## Avoid

- Unnecessary global state
- Excessive Context usage
- Polling without user interaction
- Large client bundles
- Heavy animations
- Unnecessary re-renders
