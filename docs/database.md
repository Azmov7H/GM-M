# Database

## Stack

- **Engine:** SQLite
- **ORM:** Drizzle ORM
- **Driver:** better-sqlite3
- **Location:** `data/app.db`

## Why SQLite

- Zero configuration
- No separate server process
- Single file database
- Excellent performance for local use
- WAL mode for concurrent reads
- Perfect for local-first architecture

## Configuration

SQLite is configured with:

- **WAL mode** - Write-Ahead Logging for better concurrency
- **Foreign keys** - Enforced at database level

## Schema

Located at `src/server/db/schema.ts`.

### Foundation Tables

| Table | Purpose |
|-------|---------|
| `users` | System users |
| `roles` | User roles |
| `permissions` | Role permissions |
| `user_roles` | User-role mapping |
| `role_permissions` | Role-permission mapping |
| `sessions` | Active sessions |
| `audit_logs` | Audit trail |
| `settings` | System settings |

## Migrations

```bash
# Generate migrations after schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema directly (prototyping only)
npm run db:push
```

Migrations are stored in the `drizzle/` directory.

## Backups

Database backups will be stored in `data/backups/`.

**Do not** manually delete or modify the database file.
