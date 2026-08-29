# Jammaz System - نظام الجماز

Local-First Inventory & POS Management System.

## Stack

- **Runtime:** Node.js 24 LTS
- **Framework:** Next.js 16 + React 19
- **Language:** TypeScript (strict)
- **UI:** Tailwind CSS + shadcn/ui + Radix UI
- **Forms:** React Hook Form + Zod
- **Data Fetching:** TanStack Query
- **Database:** SQLite + Drizzle ORM + better-sqlite3
- **Testing:** Vitest + Playwright
- **Code Quality:** ESLint + Prettier

## Requirements

- Node.js 24 LTS
- npm
- Git

## Installation

```bash
git clone <repo-url>
cd alli-jamm
npm install
```

## Development

```bash
npm run dev
```

## Production-like Local Execution

```bash
npm run build
npm run start
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check Prettier formatting |
| `npm run typecheck` | Run TypeScript compiler |
| `npm run test` | Run Vitest tests |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:e2e` | Run Playwright tests |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run Drizzle migrations |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:push` | Push schema to database |

## Database

SQLite database is stored at `data/app.db`.

## Environment Variables

Copy `.env.example` to `.env.local` and configure as needed.

## Architecture

See `docs/architecture.md` for detailed architecture documentation.
