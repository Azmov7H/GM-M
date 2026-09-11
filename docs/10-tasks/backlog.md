# Task Backlog

## Backlog Rules

1. Every task must have a unique ID
2. Every task must have a priority (P0-P4)
3. Every task must have dependencies listed
4. No P1 task depends on unfinished P0 work
5. Tasks are estimated in size (Small/Medium/Large/Very Large)

## Reconciliation — Part A Close-out (CLOSE-01)

All 28 tasks verified Done against the main branch. Evidence per phase
(squash commits on `main`, all pushed):

| Phase | Commit                | Evidence                                                          |
| ----- | --------------------- | ----------------------------------------------------------------- |
| P1    | `444bfc7`             | Toolchain runs: vitest 107 green, `next build` 65 pages           |
| P2    | `df185ae`             | App shell, RTL system, command palette, error boundaries          |
| P3    | `22eff40`             | 24-table schema, `drizzle/` migrations, seed, db helpers          |
| P4    | `21bd1cb`             | Login, sessions, `proxy.ts`, RBAC, 36 auth tests                  |
| P5    | `55670fc`             | Products, stock, transfers, counts, movements audit               |
| P6    | `cecfb08` + `31771c1` | Sale service, POS + F2 shortcut, returns, `tests/e2e/pos.spec.ts` |
| P7    | `c4d538d`             | PO create/receive into `wh_main`, supplier debts                  |
| P8    | `749ed6f`             | Customer/supplier cards, payments, debts center                   |
| P9    | `eb41728`             | Dashboard KPIs, 5 reports, CSV export (`csv.ts`)                  |
| P10   | `b5ecc32`             | Online backup, gated restore, product CSV import/export           |
| P11   | `c1ea928`             | 50/50 routes authed, escalation guards, CSRF, audit trail         |
| P12   | `4cc0b10`             | SQL aggregates, batched writes, Lighthouse 95/95                  |
| P13   | `0befb48`             | 102 unit + 54 e2e (chromium+firefox), a11y/RTL specs              |
| P14   | `de643b5`             | Prod build verified, deployment guide, AR manual                  |
| P15   | `41a11be`             | Demo script, regression green, repo cleanup                       |
| CUST  | `1000d14`             | Settings API/UI, returns + cashier pages, invoice branding        |

## P0 — Critical Foundation

| ID             | Title                                | Phase | Size   | Dependencies  | Status |
| -------------- | ------------------------------------ | ----- | ------ | ------------- | ------ |
| TASK-INFRA-001 | Fix vitest/bus error on AMD hardware | P1    | Medium | —             | Done   |
| TASK-INFRA-002 | Verify Next.js build (Node 22)       | P1    | Small  | —             | Done   |
| TASK-INFRA-003 | Verify `npm run dev` serves pages    | P1    | Small  | —             | Done   |
| TASK-INFRA-008 | Create root error boundaries         | P1    | Small  | —             | Done   |
| TASK-DB-001    | Design complete Drizzle schema       | P3    | Large  | —             | Done   |
| TASK-DB-002    | Create migration files               | P3    | Medium | TASK-DB-001   | Done   |
| TASK-AUTH-001  | Implement login page                 | P4    | Medium | P1, P3        | Done   |
| TASK-AUTH-002  | Implement session management         | P4    | Large  | P1, P3        | Done   |
| TASK-AUTH-003  | Implement middleware                 | P4    | Medium | TASK-AUTH-002 | Done   |
| TASK-AUTH-004  | Implement permission checking        | P4    | Medium | TASK-AUTH-002 | Done   |

## P1 — Core Business

| ID            | Title                    | Phase | Size       | Dependencies  | Status |
| ------------- | ------------------------ | ----- | ---------- | ------------- | ------ |
| TASK-INV-001  | Product CRUD             | P5    | Large      | P3, P4        | Done   |
| TASK-INV-005  | Stock level tracking     | P5    | Large      | TASK-INV-001  | Done   |
| TASK-INV-007  | Stock transfers          | P5    | Medium     | TASK-INV-005  | Done   |
| TASK-SALE-001 | Invoice creation service | P6    | Large      | P3, P4, P5    | Done   |
| TASK-SALE-002 | POS interface            | P6    | Very Large | TASK-SALE-001 | Done   |
| TASK-CUST-001 | Customer CRUD            | P8    | Medium     | P3, P4        | Done   |
| TASK-PUR-001  | Purchase order creation  | P7    | Medium     | P3, P4, P5    | Done   |

## P2 — Important

| ID            | Title           | Phase | Size   | Dependencies | Status |
| ------------- | --------------- | ----- | ------ | ------------ | ------ |
| TASK-REP-001  | Dashboard page  | P9    | Medium | P5, P6       | Done   |
| TASK-REP-002  | Sales report    | P9    | Medium | P6           | Done   |
| TASK-BKUP-001 | Backup creation | P10   | Small  | P3           | Done   |
| TASK-BKUP-002 | Backup restore  | P10   | Small  | P3           | Done   |

## P3 — Enhancement

| ID            | Title                         | Phase | Size   | Dependencies | Status |
| ------------- | ----------------------------- | ----- | ------ | ------------ | ------ |
| TASK-SEC-001  | Security code review          | P11   | Large  | All features | Done   |
| TASK-PERF-001 | Bundle size optimization      | P12   | Medium | All features | Done   |
| TASK-TEST-001 | Unit tests for all services   | P13   | Large  | All features | Done   |
| TASK-TEST-003 | E2E tests for major workflows | P13   | Large  | All features | Done   |

## P4 — Optional

| ID            | Title                    | Phase | Size   | Dependencies  | Status |
| ------------- | ------------------------ | ----- | ------ | ------------- | ------ |
| TASK-UI-014   | Command palette (Ctrl+K) | P2    | Medium | P2            | Done   |
| TASK-SALE-008 | POS keyboard shortcuts   | P6    | Small  | TASK-SALE-002 | Done   |
| TASK-REP-008  | CSV export               | P10   | Small  | P9            | Done   |

## Task Count by Phase

| Phase     | P0     | P1     | P2     | P3    | P4    | Total   |
| --------- | ------ | ------ | ------ | ----- | ----- | ------- |
| P1        | 5      | 4      | 2      | 1     | 0     | 12      |
| P2        | 0      | 8      | 5      | 1     | 1     | 15      |
| P3        | 3      | 5      | 0      | 0     | 0     | 8       |
| P4        | 4      | 5      | 2      | 1     | 0     | 12      |
| P5        | 5      | 10     | 0      | 0     | 0     | 15      |
| P6        | 3      | 6      | 2      | 0     | 1     | 12      |
| P7        | 2      | 3      | 0      | 0     | 0     | 5       |
| P8        | 2      | 4      | 0      | 0     | 0     | 6       |
| P9        | 2      | 3      | 2      | 1     | 0     | 8       |
| P10       | 2      | 2      | 1      | 0     | 0     | 5       |
| P11       | 0      | 4      | 3      | 1     | 0     | 8       |
| P12       | 0      | 3      | 2      | 1     | 0     | 6       |
| P13       | 0      | 4      | 3      | 1     | 1     | 9       |
| P14       | 0      | 2      | 2      | 0     | 0     | 4       |
| P15       | 0      | 2      | 1      | 1     | 0     | 4       |
| **Total** | **28** | **65** | **25** | **7** | **3** | **128** |
