import { NextResponse } from "next/server";

import { requireApiPermission } from "../../_helpers";
import { getPriceHistory, listReportProducts } from "@/server/services/report.service";

export async function GET(req: Request) {
  const auth = await requireApiPermission("reports:view");
  if (auth instanceof NextResponse) return auth;
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId") ?? undefined;
  const [products, points] = await Promise.all([
    listReportProducts(),
    productId ? getPriceHistory(productId) : Promise.resolve([]),
  ]);
  return NextResponse.json({ products, points });
}
