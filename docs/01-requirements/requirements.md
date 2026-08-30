# Requirements Model

## Requirement Categories

- **REQ-AUTH** — Authentication & Authorization
- **REQ-USER** — User Management
- **REQ-PROD** — Products
- **REQ-INV** — Inventory Management
- **REQ-SALE** — Sales & POS
- **REQ-PUR** — Purchasing
- **REQ-CUST** — Customers
- **REQ-SUPP** — Suppliers
- **REQ-FIN** — Financial
- **REQ-REP** — Reports
- **REQ-DASH** — Dashboard
- **REQ-SET** — Settings
- **REQ-BKUP** — Backup & Restore
- **REQ-AUDIT** — Audit
- **REQ-NFR** — Non-Functional

---

## Functional Requirements

### Authentication & Authorization

| ID           | Requirement                                               | Priority | Phase |
| ------------ | --------------------------------------------------------- | -------- | ----- |
| REQ-AUTH-001 | System shall authenticate users via username + password   | P0       | P4    |
| REQ-AUTH-002 | System shall store passwords using bcrypt (12 rounds)     | P0       | P4    |
| REQ-AUTH-003 | System shall issue JWT tokens stored in HttpOnly cookies  | P0       | P4    |
| REQ-AUTH-004 | System shall expire sessions after 24 hours of inactivity | P0       | P4    |
| REQ-AUTH-005 | System shall refresh tokens on activity                   | P1       | P4    |
| REQ-AUTH-006 | System shall redirect unauthenticated users to login      | P0       | P4    |
| REQ-AUTH-007 | System shall enforce RBAC on all server-side operations   | P0       | P4    |
| REQ-AUTH-008 | System shall log all authentication events                | P1       | P4    |
| REQ-AUTH-009 | System shall support logout (cookie clearing)             | P0       | P4    |
| REQ-AUTH-010 | System shall lock account after 5 failed login attempts   | P1       | P4    |

### User Management

| ID           | Requirement                                            | Priority | Phase |
| ------------ | ------------------------------------------------------ | -------- | ----- |
| REQ-USER-001 | Owner/Admin shall create new users                     | P0       | P4    |
| REQ-USER-002 | Owner/Admin shall edit user details                    | P0       | P4    |
| REQ-USER-003 | Owner/Admin shall deactivate users (soft delete)       | P0       | P4    |
| REQ-USER-004 | Owner/Admin shall assign roles to users                | P0       | P4    |
| REQ-USER-005 | System shall prevent deletion of the last active admin | P0       | P4    |
| REQ-USER-006 | Owner/Admin shall reset user passwords                 | P1       | P4    |
| REQ-USER-007 | Users shall view their own profile                     | P1       | P4    |
| REQ-USER-008 | Users shall change their own password                  | P1       | P4    |

### Products

| ID           | Requirement                                                 | Priority | Phase  |
| ------------ | ----------------------------------------------------------- | -------- | ------ |
| REQ-PROD-001 | Manager/Owner shall create products with name, code, prices | P0       | P5     |
| REQ-PROD-002 | Manager/Owner shall edit product details                    | P0       | P5     |
| REQ-PROD-003 | Manager/Owner shall soft-delete products                    | P0       | P5     |
| REQ-PROD-004 | System shall enforce unique product codes                   | P0       | P5     |
| REQ-PROD-005 | Manager/Owner shall manage categories                       | P0       | P5     |
| REQ-PROD-006 | Manager/Owner shall manage units of measurement             | P0       | P5     |
| REQ-PROD-007 | All users shall search products by name/code                | P0       | P5     |
| REQ-PROD-008 | System shall track buy price, retail price, wholesale price | P0       | P5     |
| REQ-PROD-009 | System shall track minimum profit margin per product        | P1       | P5     |
| REQ-PROD-010 | Manager/Owner shall set reorder minimum level               | P1       | P5     |
| REQ-PROD-011 | System shall flag products below minimum stock level        | P1       | P5     |
| REQ-PROD-012 | Products shall support barcode field                        | P2       | Future |

### Inventory Management

| ID          | Requirement                                                         | Priority | Phase |
| ----------- | ------------------------------------------------------------------- | -------- | ----- |
| REQ-INV-001 | System shall track stock quantities per location (shop/warehouse)   | P0       | P5    |
| REQ-INV-002 | System shall record all stock movements with type, quantity, reason | P0       | P5    |
| REQ-INV-003 | Manager/Owner shall transfer stock between locations                | P0       | P5    |
| REQ-INV-004 | System shall prevent negative stock                                 | P0       | P5    |
| REQ-INV-005 | Manager/Owner shall adjust stock (physical audit) with reason       | P0       | P5    |
| REQ-INV-006 | Warehouse shall view current stock levels                           | P0       | P5    |
| REQ-INV-007 | System shall maintain stock movement history (no deletion)          | P0       | P5    |
| REQ-INV-008 | System shall support physical inventory counting workflow           | P1       | P5    |
| REQ-INV-009 | Physical inventory shall have draft → review → approved states      | P1       | P5    |
| REQ-INV-010 | System shall calculate stock variance during physical count         | P1       | P5    |

### Sales & POS

| ID           | Requirement                                     | Priority | Phase |
| ------------ | ----------------------------------------------- | -------- | ----- |
| REQ-SALE-001 | Cashier shall create invoices (cash or credit)  | P0       | P6    |
| REQ-SALE-002 | POS shall support product search and quick-add  | P0       | P6    |
| REQ-SALE-003 | POS shall deduct stock on sale completion       | P0       | P6    |
| REQ-SALE-004 | System shall prevent sale if insufficient stock | P0       | P6    |
| REQ-SALE-005 | POS shall calculate totals, tax (if applicable) | P0       | P6    |
| REQ-SALE-006 | System shall support partial returns            | P0       | P6    |
| REQ-SALE-007 | System shall restore stock on return            | P0       | P6    |
| REQ-SALE-008 | Manager shall view invoice list with filters    | P0       | P6    |
| REQ-SALE-009 | System shall support service items (no stock)   | P1       | P6    |
| REQ-SALE-010 | POS shall support keyboard shortcuts for speed  | P1       | P6    |
| REQ-SALE-011 | System shall support custom pricing per item    | P1       | P6    |
| REQ-SALE-012 | System shall warn if selling below cost price   | P1       | P6    |
| REQ-SALE-013 | System shall support multiple payment methods   | P2       | P6    |

### Purchasing

| ID          | Requirement                                               | Priority | Phase |
| ----------- | --------------------------------------------------------- | -------- | ----- |
| REQ-PUR-001 | Manager shall create purchase orders                      | P0       | P7    |
| REQ-PUR-002 | Purchase order shall reference supplier                   | P0       | P7    |
| REQ-PUR-003 | Purchase order shall list items with quantities and costs | P0       | P7    |
| REQ-PUR-004 | Warehouse shall receive stock against purchase order      | P0       | P7    |
| REQ-PUR-005 | Receiving shall add stock to warehouse location           | P0       | P7    |
| REQ-PUR-006 | System shall track purchase order status                  | P1       | P7    |
| REQ-PUR-007 | Manager shall cancel purchase orders                      | P1       | P7    |

### Customers

| ID           | Requirement                                       | Priority | Phase  |
| ------------ | ------------------------------------------------- | -------- | ------ |
| REQ-CUST-001 | Manager shall create/edit customer profiles       | P0       | P8     |
| REQ-CUST-002 | System shall track customer balance (debt/credit) | P0       | P8     |
| REQ-CUST-003 | System shall record customer payment history      | P0       | P8     |
| REQ-CUST-004 | Cashier shall view customer info during sale      | P0       | P8     |
| REQ-CUST-005 | System shall support customer payment allocation  | P1       | P8     |
| REQ-CUST-006 | System shall support installment plans            | P2       | Future |

### Suppliers

| ID           | Requirement                                  | Priority | Phase |
| ------------ | -------------------------------------------- | -------- | ----- |
| REQ-SUPP-001 | Manager shall create/edit supplier profiles  | P0       | P8    |
| REQ-SUPP-002 | System shall track supplier balance          | P0       | P8    |
| REQ-SUPP-003 | System shall record supplier payment history | P0       | P8    |
| REQ-SUPP-004 | Manager shall record supplier payments       | P1       | P8    |

### Financial

| ID          | Requirement                                              | Priority | Phase |
| ----------- | -------------------------------------------------------- | -------- | ----- |
| REQ-FIN-001 | Manager shall view treasury movements                    | P0       | P8    |
| REQ-FIN-002 | System shall track all financial movements (in/out)      | P0       | P8    |
| REQ-FIN-003 | System shall maintain debt center (receivables/payables) | P0       | P8    |
| REQ-FIN-004 | Manager shall record manual financial entries            | P1       | P8    |

### Reports

| ID          | Requirement                                    | Priority | Phase |
| ----------- | ---------------------------------------------- | -------- | ----- |
| REQ-REP-001 | Manager shall view sales reports by date range | P0       | P9    |
| REQ-REP-002 | Manager shall view financial reports           | P0       | P9    |
| REQ-REP-003 | Manager shall view profit-by-customer report   | P1       | P9    |
| REQ-REP-004 | Manager shall view price history report        | P1       | P9    |
| REQ-REP-005 | Manager shall view shortage report             | P1       | P9    |
| REQ-REP-006 | Reports shall support date range filtering     | P0       | P9    |
| REQ-REP-007 | Reports shall support export to CSV            | P2       | P10   |

### Dashboard

| ID           | Requirement                                                 | Priority | Phase |
| ------------ | ----------------------------------------------------------- | -------- | ----- |
| REQ-DASH-001 | System shall display KPI summary (total sales, stock value) | P0       | P9    |
| REQ-DASH-002 | System shall display low-stock alerts                       | P0       | P9    |
| REQ-DASH-003 | System shall display recent activity                        | P1       | P9    |
| REQ-DASH-004 | System shall display sales charts                           | P2       | P9    |

### Settings

| ID          | Requirement                                  | Priority | Phase |
| ----------- | -------------------------------------------- | -------- | ----- |
| REQ-SET-001 | Admin shall configure store name and details | P0       | P9    |
| REQ-SET-002 | Admin shall configure default currency       | P0       | P9    |
| REQ-SET-003 | System shall persist settings in database    | P0       | P9    |

### Backup & Restore

| ID           | Requirement                                           | Priority | Phase |
| ------------ | ----------------------------------------------------- | -------- | ----- |
| REQ-BKUP-001 | System shall backup database to file                  | P0       | P10   |
| REQ-BKUP-002 | System shall restore database from backup file        | P0       | P10   |
| REQ-BKUP-003 | Backup shall create timestamped copies                | P1       | P10   |
| REQ-BKUP-004 | System shall validate backup integrity before restore | P1       | P10   |
| REQ-BKUP-005 | System shall support CSV import for products          | P2       | P10   |
| REQ-BKUP-006 | System shall support CSV export for products          | P2       | P10   |

### Audit

| ID            | Requirement                                               | Priority | Phase |
| ------------- | --------------------------------------------------------- | -------- | ----- |
| REQ-AUDIT-001 | System shall log all data modifications                   | P0       | P11   |
| REQ-AUDIT-002 | Audit logs shall be read-only                             | P0       | P11   |
| REQ-AUDIT-003 | Owner/Admin shall view audit logs                         | P0       | P11   |
| REQ-AUDIT-004 | Audit logs shall include user, action, timestamp, details | P0       | P11   |

---

## Non-Functional Requirements

### Performance

| ID           | Requirement             | Target | Acceptable | Critical |
| ------------ | ----------------------- | ------ | ---------- | -------- |
| REQ-NFR-P001 | Page load (initial)     | <500ms | <1s        | <3s      |
| REQ-NFR-P002 | Page navigation         | <200ms | <500ms     | <1s      |
| REQ-NFR-P003 | API response time       | <50ms  | <100ms     | <200ms   |
| REQ-NFR-P004 | Database query          | <10ms  | <25ms      | <50ms    |
| REQ-NFR-P005 | Client bundle size      | <200KB | <300KB     | <500KB   |
| REQ-NFR-P006 | Memory usage (idle)     | <100MB | <150MB     | <200MB   |
| REQ-NFR-P007 | Memory usage (active)   | <200MB | <300MB     | <400MB   |
| REQ-NFR-P008 | POS response (add item) | <100ms | <200ms     | <500ms   |
| REQ-NFR-P009 | Search results          | <100ms | <200ms     | <500ms   |
| REQ-NFR-P010 | Startup time            | <2s    | <3s        | <5s      |

### Security

| ID           | Requirement                                           | Priority |
| ------------ | ----------------------------------------------------- | -------- |
| REQ-NFR-S001 | Passwords hashed with bcrypt (12 rounds)              | P0       |
| REQ-NFR-S002 | Sessions in HttpOnly, Secure, SameSite=Strict cookies | P0       |
| REQ-NFR-S003 | All inputs validated with Zod                         | P0       |
| REQ-NFR-S004 | Server-side RBAC enforcement on every operation       | P0       |
| REQ-NFR-S005 | CSRF protection via SameSite cookies                  | P0       |
| REQ-NFR-S006 | No sensitive data in client bundles                   | P0       |
| REQ-NFR-S007 | Audit logging for all mutations                       | P0       |
| REQ-NFR-S008 | Rate limiting on login attempts                       | P1       |
| REQ-NFR-S009 | SQL injection prevention via parameterized queries    | P0       |
| REQ-NFR-S010 | XSS prevention via React escaping + CSP               | P0       |

### Reliability

| ID           | Requirement                                | Priority |
| ------------ | ------------------------------------------ | -------- |
| REQ-NFR-R001 | Data integrity via SQLite transactions     | P0       |
| REQ-NFR-R002 | Foreign key constraints enforced           | P0       |
| REQ-NFR-R003 | Backup integrity validation                | P1       |
| REQ-NFR-R004 | Graceful error handling (no white screens) | P0       |
| REQ-NFR-R005 | Automatic database WAL checkpoint          | P1       |

### Maintainability

| ID           | Requirement                               | Priority |
| ------------ | ----------------------------------------- | -------- |
| REQ-NFR-M001 | TypeScript strict mode                    | P0       |
| REQ-NFR-M002 | ESLint passes with zero errors            | P0       |
| REQ-NFR-M003 | Prettier formatting enforced              | P0       |
| REQ-NFR-M004 | Feature-oriented module structure         | P0       |
| REQ-NFR-M005 | No `any` types                            | P0       |
| REQ-NFR-M006 | Business logic in services, not UI        | P0       |
| REQ-NFR-M007 | Shared types between frontend and backend | P0       |

### Usability

| ID           | Requirement                             | Priority |
| ------------ | --------------------------------------- | -------- |
| REQ-NFR-U001 | Arabic RTL layout throughout            | P0       |
| REQ-NFR-U002 | Consistent navigation sidebar           | P0       |
| REQ-NFR-U003 | Loading states for all async operations | P0       |
| REQ-NFR-U004 | Error messages in Arabic                | P0       |
| REQ-NFR-U005 | Empty states with helpful guidance      | P1       |
| REQ-NFR-U006 | Keyboard navigation support             | P1       |
| REQ-NFR-U007 | Responsive design (desktop-first)       | P1       |

### Local Deployment

| ID           | Requirement                                           | Priority |
| ------------ | ----------------------------------------------------- | -------- |
| REQ-NFR-L001 | Single `npm install` + `npm run dev` to start         | P0       |
| REQ-NFR-L002 | No external services required (no Docker, no MongoDB) | P0       |
| REQ-NFR-L003 | Database file portable (single SQLite file)           | P0       |
| REQ-NFR-L004 | Backups as single files                               | P0       |
| REQ-NFR-L005 | Works on Node.js 22 LTS                               | P0       |
| REQ-NFR-L006 | Works on 4 GB RAM, 2 CPU cores                        | P0       |
