# AI Development Protocol

## Rules for AI Agents

When implementing tasks in this project, AI agents MUST follow these rules:

### Before Starting

1. **Read the task definition** in `docs/10-tasks/backlog.md`
2. **Read the relevant documentation** (architecture, database, API, etc.)
3. **Identify dependencies** — ensure all prerequisite tasks are complete
4. **Inspect affected code** — read existing files before modifying
5. **Understand the context** — know what the code is supposed to do

### During Implementation

6. **Implement only the requested scope** — no unrelated changes
7. **Follow existing patterns** — mimic code style, use existing libraries
8. **Use strict TypeScript** — no `any`, no `@ts-ignore`
9. **Validate all inputs** — Zod schemas for all data
10. **Enforce authorization** — server-side permission checks
11. **Handle errors gracefully** — no white screens
12. **Add audit logging** — for all mutations
13. **Use Arabic for user-facing text** — all messages in Arabic

### After Implementation

14. **Run lint** — `npm run lint` must pass
15. **Run typecheck** — `npm run typecheck` must pass
16. **Run tests** — `npm run test` must pass (if testable)
17. **Report changed files** — list all files modified
18. **Report remaining issues** — any known limitations
19. **Update task status** — mark task as complete in backlog

### Prohibited Actions

- **Never** silently change architecture
- **Never** add unrelated refactoring
- **Never** skip error handling
- **Never** use `any` type
- **Never** commit without being asked
- **Never** install new packages without approval
- **Never** modify configuration without documentation
- **Never** create files outside the planned structure

## Code Quality Checklist

Before submitting any implementation:

- [ ] TypeScript strict mode passes
- [ ] ESLint passes with 0 errors
- [ ] Prettier formatting correct
- [ ] No `any` types used
- [ ] No `@ts-ignore` or `@ts-expect-error`
- [ ] All inputs validated
- [ ] Server-side authorization enforced
- [ ] Error states handled
- [ ] Loading states handled
- [ ] Empty states handled
- [ ] Arabic text for all user-facing messages
- [ ] RTL layout verified
- [ ] No console errors
- [ ] No sensitive data exposed
- [ ] Audit logging for mutations

## File Naming Conventions

| Type       | Convention                 | Example                   |
| ---------- | -------------------------- | ------------------------- |
| Components | `kebab-case.tsx`           | `product-form.tsx`        |
| Services   | `kebab-case.ts`            | `product.service.ts`      |
| Schemas    | `kebab-case.schema.ts`     | `product.schema.ts`       |
| Types      | `kebab-case.types.ts`      | `product.types.ts`        |
| Tests      | `*.test.ts` / `*.test.tsx` | `product.service.test.ts` |
| Pages      | `page.tsx`                 | `page.tsx`                |
| Layouts    | `layout.tsx`               | `layout.tsx`              |

## Commit Message Format

```
type(scope): description

Examples:
feat(products): add product CRUD with validation
fix(inventory): prevent negative stock on concurrent sales
test(sales): add POS sale integration tests
```

## Branch Naming

```
feat/TASK-ID-short-description
fix/TASK-ID-short-description
test/TASK-ID-short-description
```
