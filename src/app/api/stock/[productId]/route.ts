import { NextResponse } from "next/server";

import { requireApiPermission } from "../../_helpers";
import { getProductStock } from "@/server/services/stock.service";

interface RouteContext {
  params: Promise<{ productId: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { productId } = await ctx.params;
  const auth = await requireApiPermission("stock:read");
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({ stock: await getProductStock(productId) });
}
