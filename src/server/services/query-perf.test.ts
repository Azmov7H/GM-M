import { sql } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", async () => {
  const { createTestDb } = await import("@/server/db/test-db");
  return { db: createTestDb() };
});

import { db } from "@/server/db";

interface PlanRow {
  detail: string;
}

/** Hot-path queries must use indexes (SEARCH), never full scans (SCAN). */
async function plan(query: ReturnType<typeof sql>): Promise<string> {
  const rows = db.all<PlanRow>(sql`EXPLAIN QUERY PLAN ${query}`);
  return rows.map((r) => r.detail).join(" | ");
}

describe("index usage on hot paths", () => {
  it("dashboard today-revenue lookup uses idx_sales_created", async () => {
    const detail = await plan(
      sql`SELECT coalesce(sum(total), 0), count(*) FROM sales WHERE status != 'cancelled' AND created_at >= '2026-09-10' AND created_at < '2026-09-11'`,
    );
    expect(detail).toContain("SEARCH");
    expect(detail).not.toContain("SCAN");
  });

  it("stock pair lookup uses idx_stocks_product", async () => {
    const detail = await plan(
      sql`SELECT product_id, warehouse_id, quantity FROM stocks WHERE product_id IN ('a', 'b')`,
    );
    expect(detail).toContain("SEARCH");
    expect(detail).not.toContain("SCAN");
  });

  it("sale items lookup uses idx_sale_items_sale", async () => {
    const detail = await plan(sql`SELECT * FROM sale_items WHERE sale_id = 'x'`);
    expect(detail).toContain("SEARCH");
    expect(detail).not.toContain("SCAN");
  });
});
