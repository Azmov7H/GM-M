# ADR-002: SQLite Local-First Database

## Context

The system needs a database that works locally without external services. Data must be portable (single file backup) and performant on low-spec hardware.

## Decision

Use SQLite with WAL mode via better-sqlite3 and Drizzle ORM.

## Alternatives Considered

| Alternative | Reason for Rejection                          |
| ----------- | --------------------------------------------- |
| MongoDB     | Requires separate server, complex local setup |
| PostgreSQL  | Requires separate server, complex local setup |
| MySQL       | Requires separate server, complex local setup |
| JSON files  | No ACID, no concurrent access, no queries     |
| IndexedDB   | Browser-only, no server-side access           |

## Consequences

**Positive:**

- Zero configuration
- Single file database (portable)
- ACID transactions
- WAL mode for concurrent reads
- No external services needed

**Negative:**

- Concurrent write limitations (WAL helps)
- No network access
- Single-writer constraint
- File-based (not client-server)

## Status

Accepted
