import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import type { DB } from "./index";

export type { DB };

const DRIZZLE_DIR = path.join(process.cwd(), "drizzle");

function migrationFiles(): string[] {
  if (!fs.existsSync(DRIZZLE_DIR)) return [];
  return fs
    .readdirSync(DRIZZLE_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

export function applyMigrations(sqlite: Database.Database) {
  for (const file of migrationFiles()) {
    const sql = fs.readFileSync(path.join(DRIZZLE_DIR, file), "utf-8");
    sqlite.exec(sql);
  }
}

export function createTestDb(): DB {
  const sqlite = new Database(":memory:");

  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  applyMigrations(sqlite);

  return drizzle(sqlite, { schema });
}
