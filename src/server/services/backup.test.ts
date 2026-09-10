import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", async () => {
  const Database = (await import("better-sqlite3")).default;
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  const schema = await import("@/server/db/schema");
  const { applyMigrations } = await import("@/server/db/test-db");
  const sqlite = new Database(":memory:");
  applyMigrations(sqlite);
  return {
    db: drizzle(sqlite, { schema }),
    // Non-memory marker so createBackup proceeds; backup() reads from the
    // in-memory handle above, restore tests inject their own liveFile.
    DATABASE_FILE: join((await import("os")).tmpdir(), "mock-live.db"),
    getSqlite: () => sqlite,
    replaceDatabaseFile: () => {
      throw new Error("must be injected in tests");
    },
  };
});

vi.mock("./audit.service", () => ({
  logAudit: vi.fn(async () => undefined),
}));

import {
  buildBackupFilename,
  checkBackupCreateLimit,
  createBackup,
  listBackups,
  resetBackupCreateLimit,
  resolveBackupPath,
  restoreBackup,
  sanitizeBackupName,
  validateBackupFile,
} from "./backup.service";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "bkup-"));
  process.env.BACKUP_DIR = dir;
});

afterEach(() => {
  delete process.env.BACKUP_DIR;
  rmSync(dir, { recursive: true, force: true });
});

describe("backup filenames", () => {
  it("builds timestamped names and accepts only safe names", () => {
    expect(buildBackupFilename(new Date(2026, 8, 10, 9, 5, 3))).toBe(
      "app-20260910-090503.db",
    );
    expect(sanitizeBackupName("app-20260910-090503.db")).toBe("app-20260910-090503.db");
    expect(sanitizeBackupName("pre-restore-20260910-090503.db")).toBe(
      "pre-restore-20260910-090503.db",
    );
    expect(sanitizeBackupName("../app.db")).toBeNull();
    expect(sanitizeBackupName("app.db")).toBeNull();
    expect(sanitizeBackupName("app-20260910-090503.db;rm")).toBeNull();
    expect(sanitizeBackupName("evil/app-20260910-090503.db")).toBeNull();
    expect(resolveBackupPath("app-20260910-090503.db", dir)).toBe(
      join(dir, "app-20260910-090503.db"),
    );
    expect(resolveBackupPath("../x", dir)).toBeNull();
  });
});

describe("create + list", () => {
  it("creates a valid backup and lists it", async () => {
    const meta = await createBackup("user_1");
    expect(meta.filename).toMatch(/^app-\d{8}-\d{6}\.db$/);
    expect(meta.size).toBeGreaterThan(0);
    const list = listBackups(dir);
    expect(list).toHaveLength(1);
    expect(list[0].filename).toBe(meta.filename);
    expect(validateBackupFile(join(dir, meta.filename))).toEqual({ ok: true });
  });
});

describe("validateBackupFile", () => {
  it("rejects corrupt and foreign files", async () => {
    const bad = join(dir, "app-20260910-000000.db");
    writeFileSync(bad, "not a database");
    const res = validateBackupFile(bad);
    expect(res.ok).toBe(false);

    const foreign = join(dir, "app-20260910-000001.db");
    const { default: Database } = await import("better-sqlite3");
    const f = new Database(foreign);
    f.exec("CREATE TABLE other (id TEXT)");
    f.close();
    expect(validateBackupFile(foreign)).toEqual({
      ok: false,
      error: "ملف النسخة لا يحتوي على جداول النظام",
    });
  });
});

describe("restoreBackup", () => {
  it("validates, keeps a safety copy, and swaps via injected swap", async () => {
    const meta = await createBackup("user_1");
    const live = join(dir, "live.db");
    writeFileSync(live, "current-data");

    const calls: [string, string][] = [];
    const res = await restoreBackup(meta.filename, {
      backupDir: dir,
      liveFile: live,
      snapshot: async (dest) => {
        writeFileSync(dest, "current-data");
      },
      swap: (src, dest) => {
        calls.push([src, dest]);
      },
    });
    expect(res.ok).toBe(true);
    expect(calls).toEqual([[join(dir, meta.filename), live]]);
    // Safety copy preserved the pre-restore content.
    const safety = join(dir, (res as { safetyCopy: string }).safetyCopy);
    expect(readFileSync(safety, "utf8")).toBe("current-data");
  });

  it("refuses unknown and invalid files without touching live data", async () => {
    const live = join(dir, "live.db");
    writeFileSync(live, "current-data");
    let swapped = false;

    expect(
      await restoreBackup("app-20200101-000000.db", {
        backupDir: dir,
        liveFile: live,
        swap: () => {
          swapped = true;
        },
      }),
    ).toEqual({ ok: false, error: "ملف النسخة الاحتياطية غير موجود" });

    const bad = join(dir, "app-20260910-000000.db");
    writeFileSync(bad, "garbage");
    const res = await restoreBackup("app-20260910-000000.db", {
      backupDir: dir,
      liveFile: live,
      swap: () => {
        swapped = true;
      },
    });
    expect(res.ok).toBe(false);
    expect(swapped).toBe(false);
    expect(readFileSync(live, "utf8")).toBe("current-data");
  });
});

describe("create rate limit", () => {
  it("allows 3 per hour then blocks", () => {
    const user = "rl-user";
    resetBackupCreateLimit(user);
    const now = Date.now();
    expect(checkBackupCreateLimit(user, now).allowed).toBe(true);
    expect(checkBackupCreateLimit(user, now).allowed).toBe(true);
    expect(checkBackupCreateLimit(user, now).allowed).toBe(true);
    const blocked = checkBackupCreateLimit(user, now);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    resetBackupCreateLimit(user);
    expect(checkBackupCreateLimit(user, now).allowed).toBe(true);
  });
});
