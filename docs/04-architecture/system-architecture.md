# System Architecture

## Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│                    Browser                           │
│  React (Server Components by default)                │
│  TanStack Query (client state for interactive parts) │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│              Next.js Application                     │
│  ┌─────────────────────────────────────────────────┐ │
│  │ App Router (Pages & Layouts)                    │ │
│  │   Server Components (default)                   │ │
│  │   Client Components (interactive only)          │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Server Actions / Route Handlers                 │ │
│  │   Form submissions                              │ │
│  │   Data mutations                                │ │
│  │   API endpoints                                 │ │
│  └─────────────────────────────────────────────────┘ │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│           Application Services Layer                 │
│  Business logic, validation, authorization           │
│  Pure functions, testable, no framework deps         │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│            Repository Layer                          │
│  Data access, query building                         │
│  Type-safe database operations                       │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│             Drizzle ORM                              │
│  Schema definition, type inference                   │
│  Query builder, migrations                           │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│              SQLite                                   │
│  WAL mode, foreign keys                              │
│  File: data/app.db                                   │
└─────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### Pages (App Router)

**Responsibility:** Page composition, routing, metadata

- Define route structure and layouts
- Compose Server Components and Client Components
- Set page metadata (title, description)
- Handle loading and error states
- **Never** contain business logic
- **Never** access database directly

### Server Actions / Route Handlers

**Responsibility:** Request handling, response formatting

- Accept form submissions
- Parse and validate request data
- Call application services
- Return structured responses
- Handle errors and return appropriate status codes
- Log audit events

### Application Services

**Responsibility:** Business logic, validation, authorization

- Implement business rules
- Validate input data (Zod schemas)
- Check permissions (RBAC)
- Coordinate between repositories
- Handle transactions
- Pure functions — no framework dependencies
- Fully testable

### Repository Layer

**Responsibility:** Data access, query building

- Build type-safe SQL queries via Drizzle
- Execute database operations
- Handle pagination
- Build search filters
- Return typed results
- **Never** contain business logic

### Database (SQLite)

**Responsibility:** Data storage, integrity, concurrency

- Enforce constraints (foreign keys, unique, not null)
- Handle WAL mode for concurrent reads
- ACID transactions for mutations
- Automatic WAL checkpointing

## Key Architectural Decisions

### Server Components by Default

Every component is a Server Component unless it needs:

- `useState`, `useReducer` (local state)
- `useEffect` (side effects)
- Event handlers (`onClick`, `onSubmit`)
- Browser APIs (`window`, `document`)
- Custom hooks that use the above

**Client Components are the exception, not the rule.**

### Feature-Oriented Architecture

```
src/features/
├── auth/           # Authentication & sessions
├── users/          # User management
├── products/       # Product catalog
├── inventory/      # Stock management
├── sales/          # Sales & POS
├── purchases/      # Purchase orders
├── customers/      # Customer management
├── suppliers/      # Supplier management
├── reports/        # Reports & analytics
└── settings/       # System settings
```

Each feature is self-contained with its own:

- Components (UI)
- Actions (Server Actions)
- Services (business logic)
- Schemas (validation)
- Types (TypeScript types)
- Queries (TanStack Query hooks)

### Data Flow

```
User Action
  ↓
Client Component (event handler)
  ↓
Server Action (request handling)
  ↓
Application Service (business logic + validation)
  ↓
Repository (data access)
  ↓
Drizzle ORM (query building)
  ↓
SQLite (execution)
  ↓
Response (back up the chain)
```

### Error Handling Strategy

```
┌─────────────────────────────┐
│ Global Error Boundary       │ ← Catches unhandled errors
│ (error.tsx)                 │
├─────────────────────────────┤
│ Route Error Boundary        │ ← Catches route-level errors
│ (error.tsx per route)       │
├─────────────────────────────┤
│ Loading States              │ ← Shows during data fetch
│ (loading.tsx per route)     │
├─────────────────────────────┤
│ Not Found                   │ ← 404 pages
│ (not-found.tsx)             │
└─────────────────────────────┘
```

### Authentication Flow

```
1. User submits credentials
  ↓
2. Server Action: validate input
  ↓
3. Service: find user, compare password (bcrypt)
  ↓
4. Service: create session record
  ↓
5. Action: set HttpOnly cookie with JWT
  ↓
6. Middleware: verify JWT on every request
  ↓
7. Service: load user permissions
  ↓
8. Check: required permission exists?
  ↓
Yes → Proceed
No → 403 Forbidden
```

### Authorization Flow

```
Route/Action accessed
  ↓
Middleware: verify JWT → extract userId
  ↓
Service: load user + role + permissions
  ↓
requirePermission(user, 'resource:action')
  ↓
Permission found? → YES → Proceed
Permission found? → NO → 403 + audit log
```

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (Arabic RTL)
│   ├── page.tsx            # Dashboard redirect
│   ├── (auth)/             # Auth route group
│   │   └── login/
│   ├── (main)/             # Main app route group
│   │   ├── layout.tsx      # Sidebar + header layout
│   │   ├── sales/
│   │   ├── inventory/
│   │   ├── parties/
│   │   ├── finance/
│   │   ├── reports/
│   │   └── system/
│   └── api/                # API route handlers
│       └── [resource]/
├── components/             # Shared components
│   ├── ui/                 # shadcn/ui base components
│   ├── layout/             # Sidebar, header, etc.
│   └── shared/             # Shared feature components
├── features/               # Feature modules
│   ├── auth/
│   │   ├── components/
│   │   ├── actions/
│   │   ├── services/
│   │   ├── schemas/
│   │   ├── queries/
│   │   └── types/
│   ├── products/
│   ├── inventory/
│   ├── sales/
│   ├── purchases/
│   ├── customers/
│   ├── suppliers/
│   ├── reports/
│   └── settings/
├── server/                 # Server-side code
│   ├── db/
│   │   ├── index.ts        # Database connection
│   │   ├── schema.ts       # Drizzle schema
│   │   └── migrations/     # Generated migrations
│   ├── repositories/       # Data access layer
│   ├── services/           # Business logic
│   └── auth/               # Authentication utilities
├── lib/                    # Shared utilities
│   ├── utils.ts            # cn() helper
│   └── constants.ts        # App constants
├── hooks/                  # Shared React hooks
├── types/                  # Shared TypeScript types
└── __tests__/              # Test files
```
