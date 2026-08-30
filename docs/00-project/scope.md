# Scope Control

## In Scope

| ID            | Feature                                      | Phase |
| ------------- | -------------------------------------------- | ----- |
| AUTH          | Authentication (username/password, sessions) | P4    |
| USERS         | User management (CRUD, roles)                | P4    |
| RBAC          | Role-Based Access Control (5 roles)          | P4    |
| PRODUCTS      | Product catalog (CRUD, categories, units)    | P5    |
| INVENTORY     | Stock management (quantities, movements)     | P5    |
| WAREHOUSE     | Dual-location stock (shop + warehouse)       | P5    |
| TRANSFER      | Stock transfers between locations            | P5    |
| PHYSICAL_INV  | Physical inventory counting                  | P5    |
| SALES         | Invoice creation and management              | P6    |
| POS           | Point-of-sale interface                      | P6    |
| RETURNS       | Sales returns (partial/full)                 | P6    |
| PURCHASES     | Purchase orders and receiving                | P7    |
| CUSTOMERS     | Customer management                          | P8    |
| SUPPLIERS     | Supplier management                          | P8    |
| PAYMENTS      | Payment tracking (customer/supplier)         | P8    |
| DEBTS         | Debt center and receivables                  | P8    |
| REPORTS       | Sales, financial, inventory reports          | P9    |
| DASHBOARD     | KPI dashboard with charts                    | P9    |
| SETTINGS      | System settings                              | P9    |
| BACKUP        | Database backup and restore                  | P10   |
| IMPORT_EXPORT | Data import/export (CSV)                     | P10   |
| AUDIT_LOG     | Activity audit trail                         | P11   |

## Out of Scope (Current Release)

| Feature                   | Reason                             |
| ------------------------- | ---------------------------------- |
| Multi-tenant              | Single business, single database   |
| Cloud sync                | Local-first only                   |
| Mobile app                | Web app only                       |
| Online payments           | Cash/credit only                   |
| Barcode scanning          | Future enhancement                 |
| Multi-language            | Arabic only (future: English)      |
| Electron/desktop wrapper  | Web app in browser                 |
| Docker deployment         | Local installation only            |
| External API integrations | No third-party APIs                |
| Accounting ledger         | Simplified financial tracking only |

## Future Features (Backlog, Not Committed)

| Feature                         | Notes                             |
| ------------------------------- | --------------------------------- |
| Barcode generation and scanning | Add to products                   |
| Print invoices                  | Thermal printer support           |
| Multi-language (EN/AR)          | i18n framework                    |
| Dark mode                       | Design system support             |
| Product images                  | File upload to local filesystem   |
| Customer loyalty                | Points system                     |
| Expense tracking                | Beyond simple financial movements |
| Tax/VAT                         | Saudi VAT compliance              |
| Reorder alerts                  | Automatic purchase suggestions    |
| Data sync between devices       | Future local network sync         |

## Change Request Process

1. **Identify** the proposed change
2. **Assess** impact on current phase and dependencies
3. **Document** in `docs/10-tasks/backlog.md` as a new task
4. **Prioritize** using P0-P4 system
5. **Approve** before implementation begins
6. **Implement** only after approval

**No feature may be implemented without being documented in the task backlog and approved for a specific phase.**
