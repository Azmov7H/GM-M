# Reference Project Analysis — Jammaz-System

## Overview

The Jammaz-System is a warehouse management system for Al-Jammaz Company built with Next.js 16, React 19, MongoDB, and shadcn/ui. It is feature-complete with 190 commits but has significant architectural and infrastructure issues.

## Existing Functionality

| Module         | Pages                                                         | Status                          |
| -------------- | ------------------------------------------------------------- | ------------------------------- |
| Authentication | Login (email/password)                                        | Working (incomplete middleware) |
| Dashboard      | KPIs, suggestions                                             | Working                         |
| Sales          | New invoice, invoice log, returns                             | Working                         |
| Customers      | Customer list, detail                                         | Working (decomposed)            |
| Inventory      | Products, stock, movements, physical inventory                | Working                         |
| Purchasing     | Purchase orders, suppliers                                    | Working                         |
| Finance        | Treasury, debt center                                         | Working (fragmented)            |
| Reports        | Financial, sales, profit-by-customer, price history, shortage | Working                         |
| System         | Users, settings, audit logs                                   | Working                         |

## Technical Implementation

### Strengths

1. **Feature-complete domain** — All major business workflows implemented
2. **Good dependency choices** — Radix UI, TanStack Query, Zod, react-hook-form installed
3. **Arabic RTL** — Full Arabic interface with RTL layout
4. **Role-based access** — 5 roles with permission arrays
5. **Layout hierarchy** — Clean root → protected → admin layout nesting
6. **Context providers** — Sidebar, notifications, query client properly wrapped

### Weaknesses (Critical)

| ID        | Issue                                               | Severity | Impact                       |
| --------- | --------------------------------------------------- | -------- | ---------------------------- |
| DX-001    | ESLint config broken, Jest broken, mixed lockfiles  | CRITICAL | No quality gate works        |
| ERR-001   | No global error surfaces (error.jsx, not-found.jsx) | CRITICAL | White screen on any error    |
| ARCH-001  | 5 god pages (600-864 lines each)                    | HIGH     | Unmaintainable               |
| NEXT-001  | 106 "use client" files, zero RSC                    | HIGH     | No server rendering benefits |
| AUTH-001  | Session expiry silently ignored                     | HIGH     | Silent auth failures         |
| AUTH-001B | Phantom "admin" role not in permissions             | HIGH     | Authorization gaps           |
| SEC-001   | Sensitive data logged in edge runtime               | HIGH     | Security exposure            |
| DATA-001  | Mutation deduplication in fetcher                   | HIGH     | Money/inventory risk         |
| FORM-001  | react-hook-form unused, forms hand-rolled           | HIGH     | Inconsistent UX              |
| PERF-001  | jsPDF statically bundled in client                  | MEDIUM   | Bundle bloat                 |
| TEST-001  | Test suite broken (24-line smoke test)              | HIGH     | No safety net                |
| COMP-001  | Triplicated product selector                        | MEDIUM   | Maintenance burden           |
| UX-001    | Native alert() ×10                                  | MEDIUM   | Unprofessional UX            |
| SEC-002   | innerHTML print hack                                | MEDIUM   | XSS risk                     |
| TYPE-001  | Zero TypeScript (0 .ts files)                       | HIGH     | Runtime contract drift       |

## Architecture Assessment

### Current Architecture

```
Browser (100% client rendering)
  ↓ fetch()
/api/* → middleware → external backend proxy (port 5050)
  ↓
MongoDB (external)
```

**Problem:** The frontend is a pure client application that proxies all API calls to an external Express backend. Next.js server capabilities are completely unused.

### Target Architecture (New System)

```
Browser
  ↓
Next.js (Server Components by default)
  ↓
Server Actions / Route Handlers
  ↓
Application Services
  ↓
Repository Layer
  ↓
Drizzle ORM
  ↓
SQLite (embedded, WAL mode)
```

## Key Lessons Learned

1. **Start with architecture** — Don't build features before the foundation is solid
2. **Server Components first** — Default to server, opt into client only when needed
3. **TypeScript strict from day one** — Prevents contract drift
4. **Test infrastructure first** — Lint + typecheck + test must pass before features
5. **One form pattern** — Pick react-hook-form + zod and enforce it everywhere
6. **Error boundaries** — Global error handling must be in place before any feature
7. **God components are technical debt** — Decompose early, not late
8. **Client-side auth is insufficient** — Server-side RBAC is mandatory
9. **SQLite is sufficient** — For local-first, single-user/single-business, SQLite outperforms MongoDB
10. **Feature-oriented beats layer-oriented** — Self-contained features scale better

## Feature Inventory for New System

| Feature                | Jammaz Has | New System Priority | Notes                                      |
| ---------------------- | ---------- | ------------------- | ------------------------------------------ |
| Login (email/password) | Yes        | P4                  | JWT + HttpOnly cookies                     |
| User CRUD              | Yes        | P4                  | With role assignment                       |
| 5-role RBAC            | Yes        | P4                  | Owner, Manager, Cashier, Warehouse, Viewer |
| Product CRUD           | Yes        | P5                  | With categories, units, pricing            |
| Dual-location stock    | Yes        | P5                  | Shop + Warehouse quantities                |
| Stock movements        | Yes        | P5                  | Full audit trail                           |
| Stock transfers        | Yes        | P5                  | Between shop and warehouse                 |
| Physical inventory     | Yes        | P5                  | Count → Review → Approve workflow          |
| Invoice creation       | Yes        | P6                  | POS-style                                  |
| Invoice list           | Yes        | P6                  | With filters and search                    |
| Sales returns          | Yes        | P6                  | Partial and full returns                   |
| Customer CRUD          | Yes        | P8                  | With balance tracking                      |
| Supplier CRUD          | Yes        | P8                  | With debt tracking                         |
| Purchase orders        | Yes        | P7                  | Order → Receive workflow                   |
| Payment tracking       | Yes        | P8                  | Customer and supplier payments             |
| Debt center            | Yes        | P8                  | Receivables and payables                   |
| Treasury/financial     | Yes        | P8                  | Financial movements                        |
| Dashboard              | Yes        | P9                  | KPIs, charts, suggestions                  |
| Reports (5 types)      | Yes        | P9                  | Sales, financial, profit, prices, shortage |
| Audit logs             | Yes        | P11                 | Read-only trail                            |
| Settings               | Yes        | P9                  | Store info, preferences                    |
| Backup/restore         | No         | P10                 | SQLite file backup                         |
| Import/export          | Partial    | P10                 | CSV import/export                          |
