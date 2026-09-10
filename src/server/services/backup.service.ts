import { existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { join } from "path";

import Database from "better-sqlite3";

import { DATABASE_FILE, getSqlite, replaceDatabaseFile } from "@/server/db";
import { logAudit } from "./audit.service";

export interface BackupMeta {
  filename: string;
  size: number;
  createdAt: string;
}

export function getBackupDir(): string {
  return process.env.BACKUP_DIR ?? "./data/backups";
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function timestamp(now: Date): string {
  return (
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  );
}

export function buildBackupFilename(now = new Date()): string {
  return `app-${timestamp(now)}.db`;
}

export function buildPreRestoreFilename(now = new Date()): string {
  return `pre-restore-${timestamp(now)}.db`;
}

const BACKUP_NAME_RE = /^(app|pre-restore)-\d{8}-\d{6}(-\d+)?\.db$/;

/** Strict allow-list: bare timestamped filenames only, no paths. */
export function sanitizeBackupName(name: string): string | null {
  if (!BACKUP_NAME_RE.test(name)) return null;
  if (name.includes("/") || name.includes("\\") || name.includes("..")) return null;
  return name;
}

export function resolveBackupPath(
  filename: string,
  backupDir = getBackupDir(),
): string | null {
  const safe = sanitizeBackupName(filename);
  if (!safe) return null;
  return join(backupDir, safe);
}

function uniquePath(dir: string, filename: string): string {
  let candidate = join(dir, filename);
  let counter = 1;
  while (existsSync(candidate)) {
    counter += 1;
    candidate = join(dir, filename.replace(/\.db$/, `-${counter}.db`));
  }
  return candidate;
}

export async function createBackup(userId?: string): Promise<BackupMeta> {
  if (DATABASE_FILE === ":memory:") {
    throw new Error("لا يمكن إنشاء نسخة احتياطية لقاعدة بيانات مؤقتة");
  }
  const dir = getBackupDir();
  mkdirSync(dir, { recursive: true });
  const dest = uniquePath(dir, buildBackupFilename());

  // Online backup API: consistent snapshot without closing the live connection.
  await getSqlite().backup(dest);

  const stat = statSync(dest);
  const filename = dest.split("/").pop()!;
  await logAudit({
    userId,
    action: "create",
    resource: "backup",
    resourceId: filename,
  });
  return { filename, size: stat.size, createdAt: stat.mtime.toISOString() };
}

export function listBackups(backupDir = getBackupDir()): BackupMeta[] {
  mkdirSync(backupDir, { recursive: true });
  return readdirSync(backupDir)
    .filter((f) => sanitizeBackupName(f) !== null)
    .map((filename) => {
      const stat = statSync(join(backupDir, filename));
      return { filename, size: stat.size, createdAt: stat.mtime.toISOString() };
    })
    .sort((a, b) => (a.filename < b.filename ? 1 : -1));
}

const CORE_TABLES = ["users", "products", "sales", "sessions", "stocks"];

export function validateBackupFile(
  path: string,
): { ok: true } | { ok: false; error: string } {
  let probe: Database.Database | null = null;
  try {
    probe = new Database(path, { readonly: true });
    const rows = probe.pragma("integrity_check") as { integrity_check: string }[];
    if (!rows.every((r) => r.integrity_check === "ok")) {
      return { ok: false, error: "فحص سلامة قاعدة البيانات فشل" };
    }
    const tables = (
      probe.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as {
        name: string;
      }[]
    ).map((r) => r.name);
    const missing = CORE_TABLES.filter((t) => !tables.includes(t));
    if (missing.length > 0) {
      return { ok: false, error: "ملف النسخة لا يحتوي على جداول النظام" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "ملف النسخة الاحتياطية غير صالح" };
  } finally {
    probe?.close();
  }
}

export interface RestoreOptions {
  backupDir?: string;
  liveFile?: string;
  swap?: (source: string, dest: string) => void;
  /** Consistent snapshot of the live DB (default: online backup API). */
  snapshot?: (dest: string) => Promise<void>;
}

export async function restoreBackup(
  filename: string,
  opts: RestoreOptions = {},
): Promise<{ ok: true; safetyCopy: string } | { ok: false; error: string }> {
  const backupDir = opts.backupDir ?? getBackupDir();
  const liveFile = opts.liveFile ?? DATABASE_FILE;
  if (liveFile === ":memory:") {
    return { ok: false, error: "لا يمكن الاستعادة على قاعدة بيانات مؤقتة" };
  }
  const source = resolveBackupPath(filename, backupDir);
  if (!source || !existsSync(source)) {
    return { ok: false, error: "ملف النسخة الاحتياطية غير موجود" };
  }
  const valid = validateBackupFile(source);
  if (!valid.ok) {
    return { ok: false, error: valid.error };
  }

  mkdirSync(backupDir, { recursive: true });
  const safetyCopy = uniquePath(backupDir, buildPreRestoreFilename());
  // Snapshot via the online backup API: a raw file copy of a WAL-mode
  // database can miss uncheckpointed pages and yield a stale snapshot.
  const snapshot =
    opts.snapshot ??
    (async (dest: string) => {
      await getSqlite().backup(dest);
    });
  try {
    await snapshot(safetyCopy);
  } catch {
    return { ok: false, error: "تعذر حفظ نسخة أمان قبل الاستعادة" };
  }

  try {
    if (opts.swap) {
      opts.swap(source, liveFile);
    } else {
      replaceDatabaseFile(source);
    }
  } catch {
    return { ok: false, error: "فشلت الاستعادة — البيانات الحالية محفوظة" };
  }
  return {
    ok: true,
    safetyCopy: safetyCopy.split("/").pop()!,
  };
}

// Backup creation is rate-limited: 3 per hour per user (API-BKUP policy).
const CREATE_WINDOW_MS = 60 * 60 * 1000;
const CREATE_MAX = 3;
const createWindows = new Map<string, { count: number; firstAt: number }>();

export function checkBackupCreateLimit(
  userId: string,
  now = Date.now(),
): { allowed: boolean; retryAfterSeconds: number } {
  const w = createWindows.get(userId);
  if (!w || now - w.firstAt > CREATE_WINDOW_MS) {
    createWindows.set(userId, { count: 1, firstAt: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  w.count += 1;
  if (w.count <= CREATE_MAX) {
    return { allowed: true, retryAfterSeconds: 0 };
  }
  return {
    allowed: false,
    retryAfterSeconds: Math.max(
      0,
      Math.ceil((w.firstAt + CREATE_WINDOW_MS - now) / 1000),
    ),
  };
}

export function resetBackupCreateLimit(userId: string): void {
  createWindows.delete(userId);
}
