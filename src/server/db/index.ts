import { copyFileSync, existsSync, rmSync } from "fs";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

export const DATABASE_FILE = process.env.DATABASE_URL ?? "./data/app.db";

function openDatabase() {
  const sqlite = new Database(DATABASE_FILE);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return sqlite;
}

let sqlite = openDatabase();

// Reassignable so a file-level database restore can reopen the connection.
// Importers always see the current instance via the ESM live binding.
export let db = drizzle(sqlite, { schema });
export type DB = typeof db;

/** Raw better-sqlite3 handle (online backup API, pragmas). */
export function getSqlite() {
  return sqlite;
}

/**
 * Replace the live database file and reopen the connection.
 * Closes the singleton first so no handle points at the old inode,
 * then removes stale WAL sidecars from the replaced file.
 */
export function replaceDatabaseFile(replacementPath: string) {
  try {
    sqlite.pragma("wal_checkpoint(TRUNCATE)");
  } catch {
    // Best effort: close() checkpoints anyway.
  }
  sqlite.close();
  copyFileSync(replacementPath, DATABASE_FILE);
  for (const suffix of ["-wal", "-shm", "-journal"]) {
    const sidecar = `${DATABASE_FILE}${suffix}`;
    if (existsSync(sidecar)) {
      rmSync(sidecar);
    }
  }
  sqlite = openDatabase();
  db = drizzle(sqlite, { schema });
}
