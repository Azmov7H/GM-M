import type Database from "better-sqlite3";
import { sql, type SQL } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/sqlite-core/utils";
import type { AnySQLiteTable } from "drizzle-orm/sqlite-core";
import type { DB } from "../db";
import { uid } from "../db/factories";

export type Where = SQL | undefined;

export class BaseRepository<TTable extends AnySQLiteTable> {
  protected tableName: string;
  protected client: Database.Database;

  constructor(
    protected db: DB,
    protected table: TTable,
  ) {
    const config = getTableConfig(table);
    this.tableName = config.name;
    this.client = db.$client as unknown as Database.Database;
  }

  private quote(ident: string): string {
    return `\`${ident.replace(/`/g, "``")}\``;
  }

  async findById(id: string): Promise<unknown> {
    const stmt = this.client.prepare(
      `SELECT * FROM ${this.quote(this.tableName)} WHERE ${this.quote("id")} = ? LIMIT 1`,
    );
    return stmt.get(id);
  }

  async findAll(where: Where = undefined): Promise<unknown[]> {
    const qb = this.db.select().from(this.table);
    if (where) {
      return qb.where(where);
    }
    return qb;
  }

  async create(data: Record<string, unknown>): Promise<unknown> {
    const config = getTableConfig(this.table);
    const cols = config.columns as { name: string }[];
    const hasId = cols.some((c) => c.name === "id");
    const hasCreatedAt = cols.some((c) => c.name === "created_at");
    const hasUpdatedAt = cols.some((c) => c.name === "updated_at");

    const values: Record<string, unknown> = { ...data };
    const now = new Date().toISOString();
    if (hasId && values["id"] == null)
      values["id"] = uid(this.tableName.slice(0, 4) || "row");
    if (hasCreatedAt && values["created_at"] == null) values["created_at"] = now;
    if (hasUpdatedAt && values["updated_at"] == null) values["updated_at"] = now;

    const keys = Object.keys(values);
    const cols_sql = keys.map((k) => this.quote(k)).join(", ");
    const placeholders = keys.map(() => "?").join(", ");
    const params = keys.map((k) => values[k]);

    const info = this.client
      .prepare(
        `INSERT INTO ${this.quote(this.tableName)} (${cols_sql}) VALUES (${placeholders})`,
      )
      .run(...params);
    const id = values["id"] ?? (info.lastInsertRowid as number).toString();
    return this.findById(id as string);
  }

  async update(id: string, data: Record<string, unknown>): Promise<unknown> {
    const config = getTableConfig(this.table);
    const cols = config.columns as { name: string }[];
    const hasUpdatedAt = cols.some((c) => c.name === "updated_at");

    const values: Record<string, unknown> = { ...data };
    if (hasUpdatedAt && values["updated_at"] == null)
      values["updated_at"] = new Date().toISOString();
    delete values["id"];

    const setSql = Object.keys(values)
      .map((k) => `${this.quote(k)} = ?`)
      .join(", ");
    const params = [...Object.values(values), id];

    this.client
      .prepare(
        `UPDATE ${this.quote(this.tableName)} SET ${setSql} WHERE ${this.quote("id")} = ?`,
      )
      .run(...params);
    return this.findById(id);
  }

  async hardDelete(id: string): Promise<unknown> {
    const row = await this.findById(id);
    this.client
      .prepare(`DELETE FROM ${this.quote(this.tableName)} WHERE ${this.quote("id")} = ?`)
      .run(id);
    return row;
  }

  async count(where: Where = undefined): Promise<number> {
    const qb = this.db.select({ c: sql<number>`count(*)` }).from(this.table);
    const rows = where ? await qb.where(where) : await qb;
    return rows[0]?.c ?? 0;
  }
}
