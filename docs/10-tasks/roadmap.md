# Project Phases

## Phase Overview

| Phase | Name                                | Dependencies   | Est. Size  |
| ----- | ----------------------------------- | -------------- | ---------- |
| P0    | Discovery & Requirements            | None           | Small      |
| P1    | Architecture & Technical Foundation | P0             | Medium     |
| P2    | UX/UI Design                        | P0             | Medium     |
| P3    | Database & Domain Model             | P1             | Medium     |
| P4    | Authentication & Authorization      | P1, P3         | Medium     |
| P5    | Core Inventory                      | P3, P4         | Large      |
| P6    | Sales & POS                         | P3, P4, P5     | Very Large |
| P7    | Purchasing                          | P3, P4, P5     | Medium     |
| P8    | Customers & Suppliers               | P3, P4         | Medium     |
| P9    | Reports & Dashboard                 | P3, P4, P5, P6 | Medium     |
| P10   | Backup / Restore / Import / Export  | P3             | Small      |
| P11   | Security Hardening                  | P4, P5, P6     | Medium     |
| P12   | Performance Optimization            | All features   | Medium     |
| P13   | Testing & QA                        | All features   | Large      |
| P14   | Local Deployment                    | All features   | Small      |
| P15   | Final Acceptance                    | All features   | Small      |

## Phase Details

### PHASE 0: Discovery & Requirements (PLANNING — CURRENT)

**Objective:** Complete project planning and documentation

**Tasks:**

- [x] Analyze reference project (Jammaz-System)
- [x] Define functional requirements
- [x] Define non-functional requirements
- [x] Define user roles and permissions
- [x] Define business domain model
- [x] Define business workflows
- [x] Define UX information architecture
- [x] Define UI design system
- [x] Define system architecture
- [x] Define database design
- [x] Define API contracts
- [x] Define frontend architecture
- [x] Define backend architecture
- [x] Define testing strategy
- [x] Define security architecture
- [x] Define performance plan
- [x] Define deployment plan
- [x] Define Git strategy
- [x] Create ADRs
- [x] Create task backlog
- [x] Create master roadmap

**Exit Criteria:**

- All planning documents complete
- Architecture approved
- Task backlog populated
- Implementation ready to begin

---

### PHASE 1: Architecture & Technical Foundation

**Objective:** Set up project infrastructure, fix existing issues, establish quality gates

**Tasks:**

- [x] TASK-INFRA-001: Fix vitest/bus error on AMD hardware
- [x] TASK-INFRA-002: Verify Next.js build works (try Node.js 22)
- [x] TASK-INFRA-003: Verify `npm run dev` serves pages
- [x] TASK-INFRA-004: Set up ESLint with strict rules
- [x] TASK-INFRA-005: Set up Prettier with RTL-aware config
- [x] TASK-INFRA-006: Set up Vitest with proper configuration
- [x] TASK-INFRA-007: Set up Playwright configuration
- [x] TASK-INFRA-008: Create root error boundaries (error.tsx, not-found.tsx)
- [x] TASK-INFRA-009: Create loading.tsx templates
- [x] TASK-INFRA-010: Set up GitHub Actions CI
- [x] TASK-INFRA-011: Create seed script for demo data
- [x] TASK-INFRA-012: Create Arabic font integration (IBM Plex Sans Arabic)

**Exit Criteria:**

- [x] `npm run dev` works
- [x] `npm run lint` passes
- [x] `npm run typecheck` passes
- [x] `npm run test` passes
- [x] Error boundaries in place
- [x] CI pipeline green

---

### PHASE 2: UX/UI Design

**Objective:** Implement design system, layout, navigation

**Tasks:**

- [x] TASK-UI-001: Implement root layout with Arabic RTL
- [x] TASK-UI-002: Implement sidebar navigation
- [x] TASK-UI-003: Implement header component
- [x] TASK-UI-004: Implement shadcn theme (colors, typography)
- [x] TASK-UI-005: Implement loading states (Skeleton)
- [x] TASK-UI-006: Implement empty states
- [x] TASK-UI-007: Implement error states
- [x] TASK-UI-008: Implement toast notification system
- [x] TASK-UI-009: Implement dialog system
- [x] TASK-UI-010: Implement form components
- [x] TASK-UI-011: Implement data table component
- [x] TASK-UI-012: Implement search input component
- [x] TASK-UI-013: Implement breadcrumb navigation
- [x] TASK-UI-014: Implement command palette (Ctrl+K)

**Exit Criteria:**

- [x] All base UI components working
- [x] RTL layout verified
- [x] Navigation functional
- [x] Consistent design system

---

### PHASE 3: Database & Domain Model

**Objective:** Complete database schema, migrations, seed data

**Tasks:**

- [x] TASK-DB-001: Design complete Drizzle schema
- [x] TASK-DB-002: Create migration files
- [x] TASK-DB-003: Create database indexes
- [x] TASK-DB-004: Create seed script (roles, permissions, admin user)
- [x] TASK-DB-005: Create database helpers (test database, factories)
- [x] TASK-DB-006: Create repository base class
- [x] TASK-DB-007: Verify migrations work
- [x] TASK-DB-008: Verify seed data works

**Exit Criteria:**

- [x] All tables created
- [x] Indexes in place
- [x] Seed data populates correctly
- [x] Migrations run cleanly

---

### PHASE 4: Authentication & Authorization

**Objective:** Complete auth system with sessions and RBAC

**Tasks:**

- [x] TASK-AUTH-001: Implement login page (username/password)
- [x] TASK-AUTH-002: Implement session management (JWT + cookies)
- [x] TASK-AUTH-003: Implement middleware (session verification)
- [x] TASK-AUTH-004: Implement permission checking utilities
- [x] TASK-AUTH-005: Implement user CRUD (admin only)
- [x] TASK-AUTH-006: Implement role assignment
- [x] TASK-AUTH-007: Implement password hashing (bcrypt)
- [x] TASK-AUTH-008: Implement logout
- [x] TASK-AUTH-009: Implement session refresh
- [x] TASK-AUTH-010: Implement login rate limiting
- [x] TASK-AUTH-011: Implement RoleGate component
- [x] TASK-AUTH-012: Implement password change

**Exit Criteria:**

- [x] Login/logout working
- [x] Session management working
- [x] RBAC enforced server-side
- [x] All 5 roles functional

---

### PHASE 5: Core Inventory

**Objective:** Product management, stock tracking, movements

**Tasks:**

- [x] TASK-INV-001: Implement product CRUD (create, read, update, delete)
- [x] TASK-INV-002: Implement category management
- [x] TASK-INV-003: Implement unit management
- [x] TASK-INV-004: Implement product search
- [x] TASK-INV-005: Implement stock level tracking
- [x] TASK-INV-006: Implement stock movements
- [x] TASK-INV-007: Implement stock transfers (shop ↔ warehouse)
- [x] TASK-INV-008: Implement stock adjustment (physical audit)
- [x] TASK-INV-009: Implement physical inventory counting
- [x] TASK-INV-010: Implement product list page
- [x] TASK-INV-011: Implement product form (create/edit)
- [x] TASK-INV-012: Implement stock view page
- [x] TASK-INV-013: Implement movements history page
- [x] TASK-INV-014: Implement transfer dialog
- [x] TASK-INV-015: Implement adjustment dialog

**Exit Criteria:**

- [x] Products CRUD working
- [x] Stock levels accurate
- [x] Transfers atomic
- [x] Movements logged
- [x] Physical inventory workflow complete

---

### PHASE 6: Sales & POS

**Objective:** Invoice creation, POS interface, returns

**Tasks:**

- [x] TASK-SALE-001: Implement invoice creation service
- [x] TASK-SALE-002: Implement POS interface (search, cart, payment)
- [x] TASK-SALE-003: Implement invoice list page
- [x] TASK-SALE-004: Implement invoice detail page
- [x] TASK-SALE-005: Implement sales returns
- [x] TASK-SALE-006: Implement invoice printing (basic)
- [x] TASK-SALE-007: Implement sales statistics
- [x] TASK-SALE-008: Implement keyboard shortcuts for POS
- [x] TASK-SALE-009: Implement service items (no stock)
- [x] TASK-SALE-010: Implement custom pricing per item
- [x] TASK-SALE-011: Implement below-cost warning

**Exit Criteria:**

- [x] POS creates invoices correctly
- [x] Stock deducted on sale
- [x] Returns restore stock
- [x] Payment tracking working

---

### PHASE 7: Purchasing

**Objective:** Purchase orders, receiving stock

**Tasks:**

- [x] TASK-PUR-001: Implement purchase order creation
- [x] TASK-PUR-002: Implement purchase order list
- [x] TASK-PUR-003: Implement purchase order detail
- [x] TASK-PUR-004: Implement stock receiving
- [x] TASK-PUR-005: Implement purchase status tracking

**Exit Criteria:**

- [x] Purchase orders create correctly
- [x] Receiving adds to warehouse
- [x] Status tracking working

---

### PHASE 8: Customers & Suppliers

**Objective:** Customer and supplier management, payments

**Tasks:**

- [x] TASK-CUST-001: Implement customer CRUD
- [x] TASK-CUST-002: Implement customer detail page (tabs)
- [x] TASK-CUST-003: Implement customer payment recording
- [x] TASK-CUST-004: Implement supplier CRUD
- [x] TASK-CUST-005: Implement supplier payment recording
- [x] TASK-CUST-006: Implement debt center

**Exit Criteria:**

- [x] Customer/supplier CRUD working
- [x] Payments tracked
- [x] Balances accurate

---

### PHASE 9: Reports & Dashboard

**Objective:** Dashboard KPIs, report generation

**Tasks:**

- [x] TASK-REP-001: Implement dashboard page
- [x] TASK-REP-002: Implement sales report
- [x] TASK-REP-003: Implement financial report
- [x] TASK-REP-004: Implement profit-by-customer report
- [x] TASK-REP-005: Implement price history report
- [x] TASK-REP-006: Implement shortage report
- [x] TASK-REP-007: Implement date range filtering
- [x] TASK-REP-008: Implement CSV export

**Exit Criteria:**

- [x] Dashboard shows KPIs
- [x] Reports generate correctly
- [x] Export working

---

### PHASE 10: Backup / Restore / Import / Export

**Objective:** Data backup, restore, import/export

**Tasks:**

- TASK-BKUP-001: Implement backup creation
- TASK-BKUP-002: Implement backup restore
- TASK-BKUP-003: Implement backup list
- TASK-BKUP-004: Implement CSV import
- TASK-BKUP-005: Implement CSV export

**Exit Criteria:**

- Backup/restore working
- CSV import/export working

---

### PHASE 11: Security Hardening

**Objective:** Security audit, penetration testing, hardening

**Tasks:**

- TASK-SEC-001: Security code review
- TASK-SEC-002: Authentication bypass testing
- TASK-SEC-003: Authorization escalation testing
- TASK-SEC-004: Input validation testing
- TASK-SEC-005: XSS testing
- TASK-SEC-006: CSRF testing
- TASK-SEC-007: Rate limiting verification
- TASK-SEC-008: Audit log completeness check

**Exit Criteria:**

- No critical vulnerabilities
- All P0 security controls working
- Security tests passing

---

### PHASE 12: Performance Optimization

**Objective:** Meet all performance budgets

**Tasks:**

- TASK-PERF-001: Bundle size optimization
- TASK-PERF-002: Database query optimization
- TASK-PERF-003: Memory usage optimization
- TASK-PERF-004: Page load time optimization
- TASK-PERF-005: POS responsiveness optimization
- TASK-PERF-006: Lighthouse audit

**Exit Criteria:**

- All performance budgets met
- Lighthouse score >90

---

### PHASE 13: Testing & QA

**Objective:** Complete test coverage, QA pass

**Tasks:**

- TASK-TEST-001: Unit tests for all services
- TASK-TEST-002: Integration tests for critical flows
- TASK-TEST-003: E2E tests for all major workflows
- TASK-TEST-004: Security tests
- TASK-TEST-005: Performance tests
- TASK-TEST-006: Accessibility audit
- TASK-TEST-007: RTL verification
- TASK-TEST-008: Cross-browser testing

**Exit Criteria:**

- All tests passing
- Coverage targets met
- QA sign-off

---

### PHASE 14: Local Deployment

**Objective:** Production build, deployment documentation

**Tasks:**

- TASK-DEP-001: Production build verification
- TASK-DEP-002: Deployment documentation
- TASK-DEP-003: User manual
- TASK-DEP-004: Troubleshooting guide

**Exit Criteria:**

- Production build works
- Documentation complete
- Installation tested

---

### PHASE 15: Final Acceptance

**Objective:** Client acceptance, final review

**Tasks:**

- TASK-FINAL-001: Client demo
- TASK-FINAL-002: Bug fixes from feedback
- TASK-FINAL-003: Final documentation review
- TASK-FINAL-004: Repository cleanup

**Exit Criteria:**

- Client approved
- No critical bugs
- Documentation complete
- Repository clean
