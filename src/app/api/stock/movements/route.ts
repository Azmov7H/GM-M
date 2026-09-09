import { NextResponse } from "next/server";

import { requireApiPermission } from "../../_helpers";
import { listMovements } from "@/server/services/stock.service";

const MOVEMENT_TYPES = ["IN", "OUT", "SALE", "TRANSFER", "ADJUST"];

export async function GET(req: Request) {
  const auth = await requireApiPermission("stock:read");
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? undefined;
  const movements = await listMovements({
    productId: url.searchParams.get("productId") ?? undefined,
    warehouseId: url.searchParams.get("warehouseId") ?? undefined,
    type: type && MOVEMENT_TYPES.includes(type) ? type : undefined,
    limit: Math.min(Number(url.searchParams.get("limit") ?? 200) || 200, 500),
  });
  return NextResponse.json({ movements });
}
