# Architecture

## Application Layers

```
Browser
  ↓
Next.js (App Router - Server Components by default)
  ↓
Server Actions / Route Handlers
  ↓
Application Services
  ↓
Repository Layer
  ↓
Drizzle ORM
  ↓
SQLite (WAL mode)
```

## Key Principles

1. **Server Components by default** - Only use Client Components when interactivity requires it
2. **Feature-oriented structure** - Business logic organized by domain feature
3. **Clean separation** - UI never directly accesses the database
4. **Type safety** - End-to-end TypeScript with strict mode

## Directory Structure

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/       # Shared UI components
│   └── ui/           # shadcn/ui base components
├── features/         # Feature modules
│   ├── auth/
│   ├── users/
│   ├── products/
│   ├── inventory/
│   ├── sales/
│   ├── purchases/
│   ├── customers/
│   ├── suppliers/
│   ├── reports/
│   └── settings/
├── server/           # Server-side code
│   ├── db/           # Database connection and schema
│   ├── repositories/ # Data access layer
│   ├── services/     # Business logic
│   └── auth/         # Authentication
├── lib/              # Shared utilities
├── hooks/            # Shared React hooks
├── schemas/          # Shared Zod schemas
└── types/            # Shared TypeScript types
```

## Feature Structure

Each feature follows this internal structure:

```
features/<name>/
├── components/    # UI components
├── actions/       # Server Actions
├── queries/       # TanStack Query definitions
├── schemas/       # Zod validation schemas
├── services/      # Business logic
├── types/         # Feature-specific types
└── index.ts       # Public exports
```

## Database Architecture

- SQLite with WAL mode for concurrent read performance
- Drizzle ORM for type-safe database access
- Migrations stored in `drizzle/` directory
- Database file at `data/app.db`

## Server/Client Boundary

- Server Components: Default rendering mode
- Server Actions: Form handling and data mutations
- Client Components: Only for interactive UI (forms, dialogs, etc.)
- TanStack Query: Client-side cache management for server state
