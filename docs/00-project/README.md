# Project Overview

## Project Name

**GM-M** — Al-Jammaz Inventory & POS Management System (نظام إدارة مخازن الجماز)

## Objective

Design and build a production-grade, Arabic RTL, local-first inventory and point-of-sale management system for Al-Jammaz Company. The system must work offline on low-spec hardware, provide reliable data integrity, and be maintainable long-term.

## Reference Project

- **Repository:** https://github.com/Azmov7H/Jammaz-System
- **Stack:** Next.js 16 + React 19 + MongoDB + shadcn/ui
- **Status:** Feature-complete but architecture-deficient (44 remediation tasks identified)
- **Key Lessons:** 100% client-rendered (106 "use client"), broken test/lint pipeline, god components (864 lines), no form standard, incomplete auth middleware

## New System Goals

| Goal         | How                                                 |
| ------------ | --------------------------------------------------- |
| Local-first  | SQLite, no cloud dependency                         |
| Low hardware | 4 GB RAM, 2 CPU cores minimum                       |
| Clean code   | TypeScript strict, feature-oriented architecture    |
| Maintainable | Server Components, layered architecture, tests      |
| Arabic RTL   | Native RTL layout, Arabic-first design              |
| Secure       | Sessions, RBAC, input validation, audit logs        |
| Performant   | <200ms page loads, <50ms queries on target hardware |

## Technology Stack

See [docs/04-architecture/technology-stack.md](../04-architecture/technology-stack.md)

## Documentation Structure

| Directory            | Content                                          |
| -------------------- | ------------------------------------------------ |
| `00-project/`        | Project overview, scope, changelog               |
| `01-requirements/`   | Functional & non-functional requirements         |
| `02-ux/`             | Information architecture, navigation, user flows |
| `03-ui/`             | Design system, component library plan            |
| `04-architecture/`   | System architecture, ADRs, layers                |
| `05-database/`       | Database design, schema plan, ERD                |
| `06-api/`            | API contract plan                                |
| `07-frontend/`       | Frontend architecture, patterns                  |
| `08-backend/`        | Backend architecture, services                   |
| `09-testing/`        | Testing strategy                                 |
| `10-tasks/`          | Task system, roadmap, backlog                    |
| `11-git/`            | Git strategy                                     |
| `12-security/`       | Security architecture, threat model              |
| `13-performance/`    | Performance budgets and strategy                 |
| `14-deployment/`     | Local deployment plan                            |
| `15-decisions/`      | Architectural Decision Records                   |
| `99-project-status/` | Current status, progress, known issues           |

## Master Roadmap

See [docs/10-tasks/roadmap.md](../10-tasks/roadmap.md)

## Current Phase

**PHASE 0 — Discovery & Requirements** (Planning)

All planning documents are being authored. No implementation has begun beyond the initial project scaffolding (Next.js, TypeScript, Drizzle, shadcn/ui).
