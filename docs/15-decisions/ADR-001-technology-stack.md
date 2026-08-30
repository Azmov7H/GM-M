# ADR-001: Technology Stack

## Context

The project needs a technology stack for a local-first, Arabic RTL inventory and POS management system. The system must work on low-spec hardware (4 GB RAM, 2 CPU cores) and be maintainable long-term.

## Decision

Use Next.js 16 + React 19 + TypeScript + Tailwind CSS + shadcn/ui + TanStack Query + React Hook Form + Zod + Drizzle ORM + SQLite + Vitest + Playwright.

## Alternatives Considered

| Alternative     | Reason for Rejection                             |
| --------------- | ------------------------------------------------ |
| MongoDB         | Requires separate server, not local-first        |
| Prisma          | Heavy binary engine, slower SQLite support       |
| PostgreSQL      | Requires separate server process                 |
| Express backend | Unnecessary with Next.js App Router              |
| Zustand         | Not needed — TanStack Query handles server state |
| Jest            | Slower than Vitest, worse ESM support            |

## Consequences

**Positive:**

- Zero external dependencies (no Docker, no MongoDB)
- Single-process architecture
- Excellent TypeScript support
- Fast development experience

**Negative:**

- SQLite limitations (concurrent writes, no network access)
- Next.js learning curve for new developers
- Bundle size from React + Next.js

## Status

Accepted
