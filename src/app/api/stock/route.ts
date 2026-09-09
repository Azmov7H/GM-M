import { NextResponse } from "next/server";

import { requireApiPermission } from "../_helpers";
import { getStockLevels } from "@/server/services/stock.service";

export async function GET(req: Request) {
  const auth = await requireApiPermission("stock:read");
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const lowOnly = url.searchParams.get("lowOnly") === "1";
  const levels = await getStockLevels({
    warehouseId: url.searchParams.get("warehouseId") ?? undefined,
    lowOnly: lowOnly || undefined,
    search: url.searchParams.get("search") ?? undefined,
  });
  return NextResponse.json({ levels });
}
