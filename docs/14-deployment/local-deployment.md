# Local Deployment Guide

How to install and run alli-jamm in production on a local (on-premise) machine.

## 1. Prerequisites

| Requirement | Version / Detail                    |
| ----------- | ----------------------------------- |
| Node.js     | 22 LTS (`node -v` → v22.x)          |
| npm         | ships with Node.js                  |
| Git         | for cloning / updating              |
| OS          | Linux (recommended), macOS, Windows |
| RAM         | 4 GB minimum, 8 GB recommended      |
| Disk        | 1 GB free minimum                   |
| Browser     | Chrome / Firefox latest             |

## 2. Install

```bash
# 1. Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22

# 2. Clone and install dependencies
git clone <repo-url> alli-jamm
cd alli-jamm
npm install

# 3. Configure environment
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Paste the output as SESSION_SECRET in .env
```

## 3. Environment Variables

| Variable         | Default                    | Required | Description                                     |
| ---------------- | -------------------------- | -------- | ----------------------------------------------- |
| `DATABASE_URL`   | `./data/app.db`            | No       | SQLite database file path                       |
| `SESSION_SECRET` | —                          | **Yes**  | Session signing secret (any long random string) |
| `BACKUP_DIR`     | `./data/backups`           | No       | Where `.backup` files are stored                |
| `PORT`           | `3000`                     | No       | Port via `npm run start -- -p <port>`           |
| `NODE_ENV`       | `production` (build/start) | No       | Set automatically by Next.js                    |

The app refuses to start sessions without `SESSION_SECRET` — generate one per
machine and never commit `.env`.

## 4. Initialize the Database

```bash
npm run db:migrate   # apply migrations from drizzle/
npm run db:seed      # creates roles + admin user (admin / admin123)
```

> Do **not** run `db:generate` here — that creates new migration files during
> development. Deployment only needs `db:migrate`.

Change the admin password immediately after first login
(النظام → المستخدمون).

## 5. Build and Run (Production)

```bash
npm run build
npm run start -- -p 3000
# Open http://localhost:3000/login
```

Verified working: production build compiles, migrations + seed succeed, login
API returns 200, dashboard API and POS page return 200 (Phase 14 check).

## 6. Run as a Service (systemd, Linux)

Create `/etc/systemd/system/alli-jamm.service`:

```ini
[Unit]
Description=alli-jamm inventory and POS
After=network.target

[Service]
Type=simple
User=alli
WorkingDirectory=/opt/alli-jamm
EnvironmentFile=/opt/alli-jamm/.env
ExecStart=/home/alli/.nvm/versions/node/v22.23.2/bin/npm run start -- -p 3000
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now alli-jamm
sudo systemctl status alli-jamm
```

Adjust `User=`, `WorkingDirectory=`, and the node path (`which node`) to the machine.

## 7. Updating to a New Version

```bash
cd /opt/alli-jamm
# 1. Safety backup first (Settings → backup, or copy the db file)
cp data/app.db "data/backups/app-before-update-$(date +%Y%m%d-%H%M%S).db"
# 2. Update
git pull
npm install
npm run db:migrate   # new migrations, if any
npm run build
sudo systemctl restart alli-jamm
```

## 8. Data Locations

| Data       | Location                                      | Backed up?                         |
| ---------- | --------------------------------------------- | ---------------------------------- |
| Database   | `data/app.db` (+ `-wal`/`-shm` while running) | **Yes — critical**                 |
| Backups    | `data/backups/` (`BACKUP_DIR` override)       | Yes (off-machine copy recommended) |
| Migrations | `drizzle/`                                    | In git, no backup needed           |

`data/app.db*` is gitignored — it never leaves the machine via git.
Copy `data/backups/` to external storage regularly.

## 9. Backup and Restore

- **Manual file backup:** stop the app (or rely on SQLite online backup),
  then `cp data/app.db data/backups/app-$(date +%Y%m%d-%H%M%S).db`.
- **In-app backup:** النظام → الإعدادات → إنشاء نسخة احتياطية (rate limit:
  3 per hour per user), then download.
- **Restore:** النظام → الإعدادات → استعادة — uploads a backup, verifies
  integrity, takes a safety snapshot first, and requires typed confirmation.
  **This overwrites current data** and signs everyone out.

## 10. First-Login Checklist

1. Log in as `admin` / `admin123`.
2. Change the admin password (النظام → المستخدمون).
3. Create roles/users for cashiers and warehouse staff.
4. Add warehouses, units, categories, products + opening stock.
5. Create one test sale in POS, then a backup.
