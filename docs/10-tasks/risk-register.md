# Risk Register

## Risk Matrix

| Risk ID  | Description                                 | Probability | Impact | Severity | Mitigation                                     | Contingency                               | Phase |
| -------- | ------------------------------------------- | ----------- | ------ | -------- | ---------------------------------------------- | ----------------------------------------- | ----- |
| RISK-001 | AMD hardware bus error prevents development | Confirmed   | High   | Critical | Test with Node.js 22 LTS                       | Use alternative hardware or cloud dev     | P1    |
| RISK-002 | SQLite concurrent write conflicts           | Low         | High   | High     | WAL mode, single-writer pattern                | Implement retry logic, user notification  | P5    |
| RISK-003 | Data corruption from concurrent sales       | Medium      | High   | High     | Database transactions, atomic operations       | Restore from backup                       | P6    |
| RISK-004 | Backup failure                              | Low         | High   | Medium   | Integrity validation, multiple backups         | Manual SQLite recovery                    | P10   |
| RISK-005 | Arabic RTL layout issues                    | Medium      | Medium | Medium   | Test early, use logical CSS properties         | Manual RTL fixes per component            | P2    |
| RISK-006 | AI-generated code quality                   | Medium      | Medium | Medium   | Code review, testing, linting, security audit  | Manual review of all AI code              | All   |
| RISK-007 | Scope creep                                 | High        | Medium | Medium   | Strict scope control, change request process   | Defer features to future releases         | All   |
| RISK-008 | Performance on low-spec hardware            | Medium      | High   | High     | Performance budgets, early testing             | Optimize or reduce features               | P12   |
| RISK-009 | Security vulnerabilities in AI code         | Medium      | High   | High     | Security testing, code review, OWASP checklist | Security audit before production          | P11   |
| RISK-010 | Node.js version compatibility               | Low         | Medium | Low      | Use LTS version, test on target                | Downgrade Node.js if needed               | P1    |
| RISK-011 | shadcn/ui RTL limitations                   | Medium      | Medium | Medium   | Test components in RTL, contribute fixes       | Custom component overrides                | P2    |
| RISK-012 | Database migration failures                 | Low         | High   | Medium   | Test migrations on clean database              | Manual migration, backup restore          | P3    |
| RISK-013 | Client requirements change                  | Medium      | Medium | Medium   | Regular check-ins, flexible architecture       | Adapt roadmap, document changes           | All   |
| RISK-014 | Single developer bottleneck                 | Medium      | Medium | Medium   | AI-assisted development, good documentation    | Document everything, modular architecture | All   |
| RISK-015 | Memory leaks in long-running sessions       | Low         | Medium | Low      | Memory profiling, cleanup patterns             | Restart server, investigate               | P12   |

## Risk Review

- Review risks at the end of each phase
- Update probability and impact based on new information
- Add new risks as they are identified
- Close risks that are no longer relevant

## Retirement — Part A Close-out (CLOSE-02)

| Risk ID  | Verdict                  | Rationale                                                             |
| -------- | ------------------------ | --------------------------------------------------------------------- |
| RISK-001 | **Retired**              | Toolchain runs on this hardware: 107 vitest + build green (P1/P13)    |
| RISK-005 | **Retired**              | RTL verified by `a11y-rtl.spec.ts` across 8 pages (P13)               |
| RISK-008 | **Retired**              | Lighthouse 95 dashboard + 95 POS on desktop (P12)                     |
| RISK-009 | **Retired**              | P11 audit done: 50/50 routes authed, escalation guards, CSRF          |
| RISK-011 | **Retired**              | Components tested in RTL; logical props used throughout (P2/P13)      |
| RISK-012 | **Retired**              | Migrations tested on clean scratch DBs repeatedly (P13/P14/CUST)      |
| RISK-015 | **Retired**              | No leak evidence in testing; systemd `Restart=on-failure` documented  |
| RISK-002 | **Active (operational)** | WAL + single-writer + txns hold; monitor `SQLITE_BUSY` in prod logs   |
| RISK-003 | **Active (operational)** | Atomic sales + invoice retry hold; safety net is daily backup         |
| RISK-004 | **Active (operational)** | Integrity-checked backups + safety snapshots; keep off-machine copies |
| RISK-006 | **Active (process)**     | Applies to all future AI-generated code; gates stay mandatory         |
| RISK-007 | **Active (process)**     | v2 scope gated by change-request process in `scope.md`                |
| RISK-010 | **Active (low)**         | Pinned to Node 22 LTS; revisit on Node 24 LTS                         |
| RISK-013 | **Active (process)**     | Client check-ins continue through go-live                             |
| RISK-014 | **Active (process)**     | Mitigated by docs; demo script + manuals transfer knowledge           |
