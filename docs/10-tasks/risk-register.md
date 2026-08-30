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
