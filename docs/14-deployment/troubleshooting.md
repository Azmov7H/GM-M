# Troubleshooting Guide

Common problems and fixes for a local alli-jamm installation.
Data locations: database `data/app.db` (`DATABASE_URL` override),
backups `data/backups/` (`BACKUP_DIR` override).

## Server Won't Start

### Port already in use

```
Error: listen EADDRINUSE :::3000
```

Find and stop the old process, or use another port:

```bash
fuser -k 3000/tcp
# or run on a different port:
npm run start -- -p 3001
```

### Missing SESSION_SECRET

```
Error: SESSION_SECRET environment variable is not set
```

Generate one and put it in `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# .env: SESSION_SECRET=<output>
```

## Login Problems

| Symptom                                | Cause                                                                               | Fix                                                 |
| -------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------- |
| `429` on login, "too many attempts"    | Rate limit: 5 failed logins / 15 min per user+IP                                    | Wait 15 minutes; check caps-lock / correct username |
| Logged out unexpectedly                | Session expired (sliding refresh) or admin restored a backup (all sessions revoked) | Log in again                                        |
| Redirected to `/login` from every page | No valid session cookie                                                             | Log in; if it persists, clear site cookies          |

## Database Problems

### Database locked / `SQLITE_BUSY`

- The app uses WAL mode, so this is rare. Stop the server, remove the
  `-wal`/`-shm` sidecars **only if the server is stopped**, restart:
  ```bash
  sudo systemctl stop alli-jamm   # or fuser -k 3000/tcp
  rm -f data/app.db-wal data/app.db-shm
  npm run start -- -p 3000
  ```
- Never copy `data/app.db` while the server runs — use the in-app backup
  (online backup API) instead.

### Migration fails on update

```bash
# 1. Back up first
cp data/app.db "data/backups/app-$(date +%Y%m%d-%H%M%S).db"
# 2. Retry
npm run db:migrate
```

If the DB is a scratch/test database and data loss is acceptable:

```bash
rm -f data/app.db data/app.db-wal data/app.db-shm
npm run db:migrate
npm run db:seed
```

### Seed complains admin already exists

Seed is idempotent for the admin user — safe to re-run.

## Business-Operation Errors

| Message (Arabic)                      | Meaning                              | Fix                                          |
| ------------------------------------- | ------------------------------------ | -------------------------------------------- |
| مخزون غير كافٍ (`INSUFFICIENT_STOCK`) | Sale/transfer exceeds stock          | Check stock page; receive purchase or adjust |
| لا يمكن دفع أكثر من الرصيد            | Payment exceeds debt                 | Enter amount ≤ outstanding balance           |
| لا يمكن تعطيل عميل/مورد عليه رصيد     | Deactivate blocked by balance        | Settle the balance first                     |
| لا يمكن إرجاع فاتورة ملغاة / مرتجعة   | Return on cancelled/returned invoice | Returns allowed once                         |
| Backup `429`                          | 3 backups / hour / user              | Wait, or download an existing backup         |

## Build / Update Problems

### `npm run build` fails with memory error

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### `npm install` is slow or flaky

Reuse cache, avoid `npm ci` on slow networks; ensure Node 22
(`node -v`). The repo uses npm — a stray `pnpm-lock.yaml` may exist on
some machines; ignore it.

### Page shows old version after update

Hard-refresh (`Ctrl+Shift+R`). If it persists, rebuild:
`npm run build` then restart the service.

## Backup / Restore Problems

- **Restore says file invalid:** only `.backup` files created by the app
  (or a raw `app.db` copy taken while stopped) are accepted; integrity is
  verified before anything is touched.
- **Everyone logged out after restore:** expected — restore revokes all
  sessions. Log in again.
- **Forgot to back up before restore:** the app takes an automatic safety
  snapshot first — look in `data/backups/` for the latest file.

## Getting Help

1. Note the exact error message (Arabic text or status code).
2. Check the server log: `sudo journalctl -u alli-jamm -n 100 --no-pager`
   (or the terminal output if run manually).
3. Record what was clicked just before (page + action).
4. Restore the latest backup if data looks wrong — then report the issue
   with steps 1–3.
