# Remaining Plan: Go-Live + v2

Status: P1–P15 (the committed scope) are complete and accepted. This document
covers everything left to make the system live and evolve it. Three parts:
**A. Close-out**, **B. Go-live**, **C. v2 roadmap**. Nothing in Part C is
committed until approved per the change-request process in `scope.md`.

## Part A — Close-out (docs hygiene, no code)

| ID       | Item                                                                                                                                                                                             | Owner |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| CLOSE-01 | Reconcile `docs/10-tasks/backlog.md`: 28 tasks still read "Pending" though implemented — mark Done with phase/commit refs                                                                        | Dev   |
| CLOSE-02 | Retire `risk-register.md` risks that are mitigated (RISK-001 AMD bus error, RISK-005 RTL, RISK-008 perf, RISK-009 security audit, RISK-012 migrations); keep RISK-002/003/004/007 as operational | Dev   |
| CLOSE-03 | Verify every P0/P1 requirement in `requirements.md` traces to an implemented route/service (spot-check, don't re-test everything)                                                                | Dev   |

Size: Small. Do first — it unblocks honest progress tracking.

## Part B — Go-live punch list (operations, no new features)

| ID    | Item                                                                                                                                        | Depends      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| GO-01 | Run the client demo (`docs/99-project-status/client-demo.md`), record feedback with severity                                                | —            |
| GO-02 | Fix any blocker feedback from GO-01; defer non-blockers to Part C                                                                           | GO-01        |
| GO-03 | Production onboarding: install per `local-deployment.md`, change admin password, create real users/roles                                    | GO-01        |
| GO-04 | Enter real opening data: warehouses, units, categories, products, opening stock (via CSV import), customers/suppliers with opening balances | GO-03        |
| GO-05 | Activate daily backup routine (in-app backup + off-machine copy), test one restore on a scratch DB                                          | GO-03        |
| GO-06 | One supervised selling day: cashier runs real sales with dev on call; reconcile cashier page vs cash drawer at close                        | GO-04        |
| GO-07 | Written client sign-off; archive seed/demo data policy (fresh DB vs cleaned DB)                                                             | GO-02, GO-06 |

Size: Small–Medium, mostly client-side effort. System is live after GO-07.

## Part C — v2 Roadmap (proposals, not committed)

Sources: `scope.md` Future Features + `REQ-PROD-012` (barcode field) +
`REQ-CUST-006` (installments). Proposed order follows shop value first.

### v2.1 — Shop floor (P0 for v2)

| ID          | Title                                             | Size   | Notes                                                                     |
| ----------- | ------------------------------------------------- | ------ | ------------------------------------------------------------------------- |
| TASK-V2-001 | Product barcode field + structured storage        | Small  | Fulfills REQ-PROD-012; migration + product form + unique index            |
| TASK-V2-002 | Barcode scanning in POS (keyboard-wedge scanners) | Medium | Focus trap + fast-input detection; no camera scanning initially           |
| TASK-V2-003 | Thermal receipt printing                          | Medium | 80mm template, Arabic RTL, print CSS; USB printer on shop machine         |
| TASK-V2-004 | Product images (local filesystem `uploads/`)      | Medium | Upload API + validation + backup inclusion; `uploads/` already gitignored |
| TASK-V2-005 | Reorder alerts + automatic purchase suggestions   | Medium | Builds on shortage report; suggest PO drafts from reorder levels          |

### v2.2 — Money (P1 for v2)

| ID          | Title                                      | Size   | Notes                                                                  |
| ----------- | ------------------------------------------ | ------ | ---------------------------------------------------------------------- |
| TASK-V2-006 | Expense tracking (beyond simple movements) | Large  | Expense categories, recurring expenses, profit-net-of-expenses reports |
| TASK-V2-007 | Tax/VAT support (Saudi 15%)                | Large  | Per-line tax, VAT reports, invoice display; needs accountant review    |
| TASK-V2-008 | Customer installment plans                 | Large  | Fulfills REQ-CUST-006; schedules, due reminders, late tracking         |
| TASK-V2-009 | Customer loyalty points                    | Medium | Points accrual/redemption rules; POS integration                       |

### v2.3 — Platform (P2 for v2)

| ID          | Title                                     | Size       | Notes                                                                                             |
| ----------- | ----------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| TASK-V2-010 | Dark mode                                 | Small      | Design-token work; low user value in a lit shop — do last                                         |
| TASK-V2-011 | English/Arabic i18n                       | Very Large | Every string + RTL/LTR flip; only if a non-Arabic user appears                                    |
| TASK-V2-012 | Data sync between devices (local network) | Very Large | Hardest item; SQLite primary + replica protocol. Defer until a second terminal is actually needed |

### Explicit non-goals (stay out unless the business changes)

Multi-tenant, cloud sync, mobile app, online payments, Electron wrapper,
Docker deployment, external API integrations, full accounting ledger.

## Approved customization track (implemented)

Client-approved, internal-use only — translation, online payments, and product
images stay out of scope:

- CUST-01: Company/invoice settings (`company.*`, `invoice.*` keys, legacy
  `store.name` migration, `users:update`-gated API + UI).
- CUST-02: Missing pages built — `/sales/returns` (return workflow),
  `/finance/cashier` (daily closing), group index redirects.
- CUST-03: Business-logic hardening — invoice-number collision retry,
  cashier expected-cash reconciliation, 107 unit + 33 e2e green.

## Suggested execution order

1. Part A (1 session) → honest baseline.
2. Part B GO-01..GO-03 → demo + install can happen this week.
3. GO-04..GO-07 → first live selling day.
4. Approve v2.1 scope (all of it? or barcode + printing first?) → implement.
5. Revisit v2.2/v2.3 only after a month of live operation — real usage will
   re-rank this list better than any planning session.
