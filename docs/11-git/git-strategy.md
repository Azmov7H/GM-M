# Git Strategy

## Branch Structure

```
main (production-ready)
  ├── develop (integration branch)
  │     ├── feat/TASK-ID-short-description
  │     ├── fix/TASK-ID-short-description
  │     ├── refactor/TASK-ID-short-description
  │     ├── test/TASK-ID-short-description
  │     └── docs/TASK-ID-short-description
```

## Branch Naming

### Feature Branches

```
feat/PROD-001-create-product-crud
feat/SALE-001-pos-sale-flow
feat/INV-001-stock-management
feat/AUTH-001-login-session
```

### Fix Branches

```
fix/BUG-001-stock-deduction-race-condition
fix/BUG-002-invoice-total-rounding
```

### Refactor Branches

```
refactor/ARCH-001-extract-product-service
refactor/ARCH-002-server-components
```

### Test Branches

```
test/TEST-001-unit-test-infrastructure
test/TEST-002-e2e-pos-flow
```

### Documentation Branches

```
docs/DOCS-001-api-documentation
docs/DOCS-002-architecture-decisions
```

## Branch Lifecycle

1. **Create** from `develop`
2. **Implement** changes
3. **Test** locally (lint, typecheck, unit tests)
4. **Push** to remote
5. **Create PR** to `develop`
6. **Review** (self-review or peer)
7. **Merge** to `develop` (squash merge)
8. **Delete** feature branch

## Commit Conventions

### Format

```
type(scope): description

[optional body]

[optional footer]
```

### Types

| Type       | Usage                        |
| ---------- | ---------------------------- |
| `feat`     | New feature                  |
| `fix`      | Bug fix                      |
| `refactor` | Code refactoring             |
| `test`     | Adding tests                 |
| `docs`     | Documentation                |
| `style`    | Formatting (no logic change) |
| `perf`     | Performance improvement      |
| `chore`    | Build, config, dependencies  |

### Scope

| Scope       | Usage                       |
| ----------- | --------------------------- |
| `auth`      | Authentication              |
| `users`     | User management             |
| `products`  | Products                    |
| `inventory` | Stock, movements, transfers |
| `sales`     | Invoices, POS               |
| `purchases` | Purchase orders             |
| `customers` | Customer management         |
| `suppliers` | Supplier management         |
| `finance`   | Payments, treasury          |
| `reports`   | Reports                     |
| `settings`  | System settings             |
| `db`        | Database                    |
| `ui`        | UI components               |
| `api`       | API routes                  |
| `ci`        | CI/CD                       |

### Examples

```
feat(products): add product CRUD with validation
fix(inventory): prevent negative stock on concurrent sales
refactor(sales): extract invoice calculation to service
test(inventory): add stock transfer integration tests
docs(api): add API contract documentation
```

## PR Requirements

### PR Template

```markdown
## Description

Brief description of changes.

## Type

- [ ] Feature
- [ ] Bug Fix
- [ ] Refactor
- [ ] Test
- [ ] Documentation

## Checklist

- [ ] Code follows project conventions
- [ ] TypeScript strict mode passes
- [ ] ESLint passes with 0 errors
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] RTL verified
- [ ] Responsive behavior checked
- [ ] No console errors
- [ ] Performance impact considered
```

### Merge Strategy

- **Squash merge** for feature branches (clean history)
- **Merge commit** for develop → main (preserve history)

## Protected Branches

| Branch    | Protection                                |
| --------- | ----------------------------------------- |
| `main`    | No direct pushes, PR required, 1 approval |
| `develop` | No direct pushes, PR required             |

## Release Process

1. All features merged to `develop`
2. Create release branch: `release/v1.0.0`
3. Final testing on release branch
4. Merge to `main` and tag: `v1.0.0`
5. Merge back to `develop`
