# Local Deployment Plan

## Prerequisites

- Node.js 22 LTS (nvm recommended)
- npm (comes with Node.js)
- Git (for cloning)
- 4 GB RAM minimum
- 500 MB disk space

## Installation Steps

### 1. Install Node.js

```bash
# Using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22
node -v  # Should show v22.x.x
```

### 2. Clone and Install

```bash
git clone <repo-url>
cd alli-jamm
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env if needed (defaults work for local)
```

### 4. Initialize Database

```bash
npm run db:generate
npm run db:migrate
npm run db:seed  # Optional: seed with demo data
```

### 5. Start Development Server

```bash
npm run dev
# Opens at http://localhost:3000
```

### 6. Login

```
Username: admin
Password: admin123
```

## Production Build

```bash
npm run build
npm run start
# Runs on http://localhost:3000
```

## Data Locations

| Data       | Location        | Description                  |
| ---------- | --------------- | ---------------------------- |
| Database   | `data/app.db`   | SQLite database file         |
| Backups    | `data/backups/` | Timestamped backup files     |
| Uploads    | `uploads/`      | User-uploaded files (future) |
| Migrations | `drizzle/`      | Database migration files     |

## Backup Procedure

### Manual Backup

```bash
# Copy database file
cp data/app.db data/backups/app-$(date +%Y%m%d-%H%M%S).db
```

### Application Backup

Via the Settings page:

1. Go to النظام → الإعدادات
2. Click "إنشاء نسخة احتياطية"
3. Download the backup file

### Restore Procedure

Via the Settings page:

1. Go to النظام → الإعدادات
2. Click "استعادة نسخة احتياطية"
3. Select backup file
4. Confirm (WARNING: This overwrites current data)
5. System restarts

## Environment Variables

| Variable          | Default         | Description          |
| ----------------- | --------------- | -------------------- |
| `DATABASE_URL`    | `./data/app.db` | SQLite database path |
| `JWT_SECRET`      | (generated)     | JWT signing secret   |
| `NEXTAUTH_SECRET` | (generated)     | NextAuth secret      |
| `NODE_ENV`        | `development`   | Environment mode     |

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000
# Kill it
kill -9 <PID>
```

### Database Locked

```bash
# WAL mode should prevent this, but if it happens:
# Stop the server
# Delete data/app.db-wal
# Restart the server
```

### Migration Errors

```bash
# Reset database (CAUTION: deletes all data)
rm data/app.db data/app.db-wal data/app.db-shm
npm run db:generate
npm run db:migrate
npm run db:seed
```

### Memory Issues

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

## System Requirements

| Resource | Minimum                 | Recommended   |
| -------- | ----------------------- | ------------- |
| CPU      | 2 cores                 | 4 cores       |
| RAM      | 4 GB                    | 8 GB          |
| Disk     | 500 MB                  | 1 GB          |
| OS       | Linux, macOS, Windows   | Linux         |
| Browser  | Chrome 90+, Firefox 90+ | Chrome latest |
