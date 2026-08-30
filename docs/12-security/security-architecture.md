# Security Architecture

## Threat Model

### Threat Categories

| Category       | Severity | Examples                                                    |
| -------------- | -------- | ----------------------------------------------------------- |
| Authentication | Critical | Brute force, session hijacking, credential stuffing         |
| Authorization  | Critical | Privilege escalation, IDOR, missing access control          |
| Injection      | High     | SQL injection, XSS, command injection                       |
| Data Exposure  | High     | Sensitive data in logs, client bundle, error messages       |
| Data Integrity | High     | Concurrent modification, race conditions, backup corruption |
| Configuration  | Medium   | Weak secrets, debug mode in production, verbose errors      |
| Availability   | Medium   | DoS via resource exhaustion, backup failure                 |

### Security Controls

#### Authentication Controls

| Control              | Implementation                    | Priority |
| -------------------- | --------------------------------- | -------- |
| Password hashing     | bcrypt 12 rounds                  | P0       |
| Session management   | JWT + HttpOnly cookies            | P0       |
| Session expiry       | 24 hours                          | P0       |
| Failed login lockout | 5 attempts / 15 minutes           | P1       |
| Cookie security      | Secure, SameSite=Strict, HttpOnly | P0       |

#### Authorization Controls

| Control            | Implementation                             | Priority |
| ------------------ | ------------------------------------------ | -------- |
| RBAC enforcement   | Server-side on every operation             | P0       |
| Permission matrix  | Centralized, documented                    | P0       |
| Role separation    | Owner, Manager, Cashier, Warehouse, Viewer | P0       |
| Client-side hiding | RoleGate component (cosmetic only)         | P1       |

#### Input Validation Controls

| Control               | Implementation                       | Priority |
| --------------------- | ------------------------------------ | -------- |
| Schema validation     | Zod on all inputs                    | P0       |
| Type safety           | TypeScript strict mode               | P0       |
| Parameterized queries | Drizzle ORM (prevents SQL injection) | P0       |
| Output escaping       | React (prevents XSS)                 | P0       |

#### Data Protection Controls

| Control                  | Implementation             | Priority |
| ------------------------ | -------------------------- | -------- |
| No secrets in code       | Environment variables only | P0       |
| Audit logging            | All mutations logged       | P0       |
| Backup integrity         | Validation before restore  | P1       |
| Sensitive data exclusion | No passwords in responses  | P0       |

## Threat Analysis

### T001: Brute Force Login

| Field       | Detail                                                    |
| ----------- | --------------------------------------------------------- |
| Severity    | High                                                      |
| Probability | Medium                                                    |
| Impact      | Account compromise                                        |
| Mitigation  | Rate limiting (5 attempts / 15 min), lockout notification |
| Contingency | Manual account unlock by owner                            |

### T002: Session Hijacking

| Field       | Detail                                         |
| ----------- | ---------------------------------------------- |
| Severity    | Critical                                       |
| Probability | Low                                            |
| Impact      | Full system access                             |
| Mitigation  | HttpOnly cookies, SameSite=Strict, Secure flag |
| Contingency | Session invalidation, password reset           |

### T003: Privilege Escalation

| Field       | Detail                                                 |
| ----------- | ------------------------------------------------------ |
| Severity    | Critical                                               |
| Probability | Medium                                                 |
| Impact      | Unauthorized data access/modification                  |
| Mitigation  | Server-side RBAC on every operation, permission checks |
| Contingency | Audit log review, account deactivation                 |

### T004: SQL Injection

| Field       | Detail                                        |
| ----------- | --------------------------------------------- |
| Severity    | Critical                                      |
| Probability | Low                                           |
| Impact      | Data breach, data corruption                  |
| Mitigation  | Drizzle ORM parameterized queries, no raw SQL |
| Contingency | Database restore from backup                  |

### T005: XSS (Cross-Site Scripting)

| Field       | Detail                                         |
| ----------- | ---------------------------------------------- |
| Severity    | High                                           |
| Probability | Low                                            |
| Impact      | Session theft, data manipulation               |
| Mitigation  | React auto-escaping, CSP headers, no innerHTML |
| Contingency | Session invalidation                           |

### T006: CSRF (Cross-Site Request Forgery)

| Field       | Detail                                        |
| ----------- | --------------------------------------------- |
| Severity    | Medium                                        |
| Probability | Low                                           |
| Impact      | Unauthorized actions                          |
| Mitigation  | SameSite=Strict cookies, Origin header checks |
| Contingency | Session invalidation                          |

### T007: Data Corruption (Concurrent Access)

| Field       | Detail                                            |
| ----------- | ------------------------------------------------- |
| Severity    | High                                              |
| Probability | Medium                                            |
| Impact      | Financial data inconsistency                      |
| Mitigation  | SQLite transactions, WAL mode, optimistic locking |
| Contingency | Database restore from backup                      |

### T008: Backup Failure

| Field       | Detail                                                 |
| ----------- | ------------------------------------------------------ |
| Severity    | Medium                                                 |
| Probability | Low                                                    |
| Impact      | Data loss on restore                                   |
| Mitigation  | Backup integrity validation, multiple backups retained |
| Contingency | Manual SQLite recovery                                 |

### T009: Sensitive Data in Logs

| Field       | Detail                                         |
| ----------- | ---------------------------------------------- |
| Severity    | High                                           |
| Probability | High (if logging not careful)                  |
| Impact      | Credential exposure                            |
| Mitigation  | Never log passwords, tokens, or sensitive data |
| Contingency | Log review and cleanup                         |

### T010: AI-Generated Code Vulnerabilities

| Field       | Detail                                            |
| ----------- | ------------------------------------------------- |
| Severity    | Medium                                            |
| Probability | Medium                                            |
| Impact      | Undetected security flaws                         |
| Mitigation  | Security testing, code review, automated scanning |
| Contingency | Security audit before production                  |

## Security Checklist

### Pre-Deployment

- [ ] All passwords hashed with bcrypt
- [ ] JWT secrets are strong and unique
- [ ] HttpOnly, Secure, SameSite=Strict on cookies
- [ ] No sensitive data in client bundles
- [ ] No sensitive data in logs
- [ ] All inputs validated with Zod
- [ ] Server-side RBAC enforced
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (React escaping)
- [ ] CSRF protection active
- [ ] Audit logging enabled
- [ ] Backup system functional
- [ ] Error messages don't leak internals

### Ongoing

- [ ] Regular dependency updates
- [ ] Security testing in CI
- [ ] Audit log review
- [ ] Backup verification
- [ ] Access review (quarterly)
