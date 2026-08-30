# Technology Stack

## Confirmed Stack

| Layer            | Technology      | Version   | Rationale                               |
| ---------------- | --------------- | --------- | --------------------------------------- |
| Framework        | Next.js         | 16.3.3    | App Router, Server Components, RSC      |
| UI Library       | React           | 19.2.8    | Server Components, concurrent features  |
| Language         | TypeScript      | 5.x       | Strict mode, type safety                |
| Styling          | Tailwind CSS    | 4.x       | Utility-first, RTL support              |
| UI Components    | shadcn/ui       | base-nova | Accessible, customizable, Radix-based   |
| State Management | TanStack Query  | 5.x       | Server state, caching, mutations        |
| Forms            | React Hook Form | 7.x       | Performant, Zod integration             |
| Validation       | Zod             | 3.x       | Schema validation, TypeScript inference |
| ORM              | Drizzle ORM     | 0.45.x    | TypeScript-first, SQLite native         |
| Database         | SQLite          | 3.x       | Embedded, zero-config, WAL mode         |
| DB Driver        | better-sqlite3  | 13.x      | Synchronous, fast, reliable             |
| Unit Testing     | Vitest          | 3.x       | Fast, ESM-native, Vite integration      |
| E2E Testing      | Playwright      | 1.x       | Cross-browser, reliable                 |
| Linting          | ESLint          | 9.x       | Flat config, Next.js integration        |
| Formatting       | Prettier        | 3.x       | Consistent code style                   |
| Node.js          | Node.js         | 22 LTS    | Current LTS, stable                     |

## Rejected Alternatives

| Technology    | Reason for Rejection                                                        |
| ------------- | --------------------------------------------------------------------------- |
| MongoDB       | Requires separate server, not local-first, overkill for single business     |
| Prisma        | Heavy binary engine, slower SQLite support, more overhead than Drizzle      |
| PostgreSQL    | Requires separate server process, complex local setup                       |
| Express       | Unnecessary — Next.js handles server logic                                  |
| Redis         | Not needed for local-first, single-user scenario                            |
| Docker        | Adds complexity, not needed for local deployment                            |
| Zustand/Jotai | Not needed — TanStack Query handles server state, React state is sufficient |

## Technology Notes

### Why SQLite

- **Zero configuration** — No server process to start/stop
- **Single file** — `data/app.db` is the entire database
- **Portable** — Copy one file to backup/migrate
- **WAL mode** — Concurrent reads without blocking writes
- **Performance** — Faster than MongoDB for local queries (no network overhead)
- **Reliability** — ACID transactions, foreign keys enforced
- **Size** — Handles millions of rows in a single file

### Why Drizzle over Prisma

- **Lighter** — No binary engine to install
- **Faster** — Closer to SQL, less abstraction overhead
- **TypeScript-first** — Designed for TypeScript, not retrofitted
- **SQLite-native** — Better SQLite support than Prisma
- **SQL-like** — Developers familiar with SQL can read Drizzle code easily

### Why Server Components

- **Performance** — Zero client JavaScript for static content
- **Security** — Database access stays on server
- **SEO** — Pre-rendered content for search engines
- **Bundle size** — Only interactive components ship JS to client

### Why Vitest over Jest

- **ESM-native** — No module transformation needed
- **Faster** — Uses Vite's dev server for test execution
- **Better DX** — Watch mode, coverage, inline snapshots
- **TypeScript** — Native TypeScript support without config

## Dependency Map

```
Next.js 16
  ├── React 19
  ├── TypeScript 5
  ├── Tailwind CSS 4
  │     └── @tailwindcss/postcss
  ├── shadcn/ui (Radix UI)
  │     ├── @radix-ui/react-*
  │     ├── @base-ui/react
  │     ├── class-variance-authority
  │     ├── clsx
  │     ├── tailwind-merge
  │     └── cmdk
  ├── TanStack Query 5
  ├── React Hook Form 7
  │     └── @hookform/resolvers (Zod)
  ├── Zod 3
  ├── Lucide React (icons)
  └── better-sqlite3
        └── Drizzle ORM 0.45

Dev Dependencies:
  ├── Vitest 3
  │     └── @vitejs/plugin-react
  ├── Playwright 1
  ├── ESLint 9
  │     └── eslint-config-next
  ├── Prettier 3
  │     └── prettier-plugin-tailwindcss
  └── Drizzle Kit 0.18 (migrations)
```
