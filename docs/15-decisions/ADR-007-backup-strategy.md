# ADR-007: Backup Strategy

## Context

Local-first systems need reliable backup and restore mechanisms. Data loss is unacceptable for business operations.

## Decision

File-based backup: copy SQLite database file to timestamped backup in `data/backups/`. Restore by replacing current database file.

## Alternatives Considered

| Alternative            | Reason for Rejection               |
| ---------------------- | ---------------------------------- |
| Cloud backup           | Requires internet, not local-first |
| Continuous replication | Overkill for single-file database  |
| WAL archiving          | Complex, SQLite-specific           |

## Consequences

**Positive:**

- Simple to implement
- Portable (single file)
- No external services
- Can be automated (cron job)

**Negative:**

- Requires server restart after restore
- No point-in-time recovery
- Manual process (unless automated)
- Backup size equals database size

## Status

Accepted
